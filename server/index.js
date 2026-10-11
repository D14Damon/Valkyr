import { createClient } from '@libsql/client';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import { randomUUID, createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.PORT || 3010);
const PROJECT_ID = 'valkyrdirectory';
const BOOTSTRAPPED_ADMIN_EMAIL = 'kyledesillarico@gmail.com';
const VALID_ROLES = new Set(['owner', 'roster_manager', 'moderator']);
const VALID_STATUSES = new Set(['Active', 'Reserve', 'Alumni', 'Probationary']);
const MAX_PHOTO_LENGTH = 1400 * 1024;
const ACTIVITY_COLLECTIONS = new Set(['announcements', 'events', 'tournament_results']);
const DEFAULT_CLAN_SETTINGS = {
  name: 'VALKYR',
  tagline: 'Official Clan Member Directory',
  description: 'Official verified roster and member directory for VALKYR.',
  established: '2024',
  region: 'Global / SEA',
  logoBase64: '/valkyr-logo.png',
  announcement: '',
};

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
if (!tursoUrl || !tursoAuthToken) {
  throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the server environment.');
}

initializeApp({ projectId: PROJECT_ID });
const firebaseAuth = getAuth();
const database = createClient({ url: tursoUrl, authToken: tursoAuthToken });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '25mb' }));

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const route = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

async function initializeDatabase() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS member_profiles (
      id TEXT PRIMARY KEY,
      order_index INTEGER NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      profile_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS clan_settings (
      id TEXT PRIMARY KEY,
      settings_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS member_audit_log (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      member_name TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      changed_fields TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_roles (
      firebase_uid TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'roster_manager', 'moderator')),
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS clan_activity_records (
      collection_name TEXT NOT NULL,
      id TEXT NOT NULL,
      sort_at TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (collection_name, id)
    )`,
    'CREATE INDEX IF NOT EXISTS member_profiles_order_idx ON member_profiles(order_index)',
    'CREATE INDEX IF NOT EXISTS member_audit_log_created_idx ON member_audit_log(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS clan_activity_records_sort_idx ON clan_activity_records(collection_name, sort_at)',
  ];
  for (const sql of statements) await database.execute(sql);
}

async function getRequestUser(request) {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer (.+)$/i);
  if (!match) throw new ApiError(401, 'Sign in with an authorized clan account.');
  try {
    return await firebaseAuth.verifyIdToken(match[1]);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if ([
      'auth/argument-error',
      'auth/invalid-id-token',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-user-token',
    ].includes(code)) {
      throw new ApiError(401, 'Your admin session is invalid or expired. Please sign in again.');
    }
    console.error('Firebase token verification service failed:', error);
    throw new ApiError(503, 'The admin identity service is temporarily unavailable.');
  }
}

async function requireRole(request, allowedRoles) {
  const user = await getRequestUser(request);
  const email = (user.email || '').toLowerCase();
  const uid = user.uid || user.sub;
  if (email === BOOTSTRAPPED_ADMIN_EMAIL) return { ...user, uid, email, role: 'owner' };

  const result = await database.execute({
    sql: 'SELECT role FROM admin_roles WHERE firebase_uid = ? LIMIT 1',
    args: [uid],
  });
  const role = result.rows[0]?.role;
  if (typeof role !== 'string' || !allowedRoles.includes(role)) {
    throw new ApiError(403, 'Your Firebase account does not have permission for this action.');
  }
  return { ...user, uid, email, role };
}

function validateMember(member) {
  if (!member || typeof member !== 'object' || Array.isArray(member)) {
    throw new ApiError(400, 'Member data must be an object.');
  }
  const limits = [
    ['id', 128],
    ['name', 100],
    ['ign', 100],
    ['department', 50],
    ['role', 100],
    ['verificationCode', 100],
    ['game', 100],
    ['joinDate', 100],
  ];
  for (const [field, maxLength] of limits) {
    if (typeof member[field] !== 'string' || member[field].length > maxLength) {
      throw new ApiError(400, `Member ${field} must be a string no longer than ${maxLength} characters.`);
    }
  }
  if (!member.id || !/^[a-zA-Z0-9_-]+$/.test(member.id)) {
    throw new ApiError(400, 'Member ID contains unsupported characters.');
  }
  if (!member.name || !member.ign || !member.department || !member.role) {
    throw new ApiError(400, 'Member name, IGN, department, and role are required.');
  }
  if (!VALID_STATUSES.has(member.status) || typeof member.verified !== 'boolean') {
    throw new ApiError(400, 'Member status or verification data is invalid.');
  }
  if (!Number.isSafeInteger(member.order) || member.order < 0) {
    throw new ApiError(400, 'Member roster order must be a non-negative integer.');
  }
  if (typeof member.photoBase64 !== 'string' || member.photoBase64.length > MAX_PHOTO_LENGTH) {
    throw new ApiError(400, `Member photo must be a string no larger than ${MAX_PHOTO_LENGTH} characters.`);
  }
  if (member.archived !== undefined && typeof member.archived !== 'boolean') {
    throw new ApiError(400, 'Member archived status must be a boolean.');
  }
  return member;
}

function normalizeMember(member, actor, existing) {
  const now = new Date().toISOString();
  return {
    ...member,
    clanTag: member.clanTag || 'VALKYR',
    archived: member.archived === true,
    createdAt: existing?.createdAt || member.createdAt || now,
    updatedAt: now,
    updatedBy: actor.email || 'Admin',
  };
}

async function writeMember(member, actor, requestedAction) {
  validateMember(member);
  const existingResult = await database.execute({
    sql: 'SELECT profile_json FROM member_profiles WHERE id = ? LIMIT 1',
    args: [member.id],
  });
  const existing = existingResult.rows[0]
    ? JSON.parse(existingResult.rows[0].profile_json)
    : null;
  const savedMember = normalizeMember(member, actor, existing);
  const changedFields = Object.keys(savedMember).filter((field) =>
    !['photoBase64', 'updatedAt', 'updatedBy'].includes(field)
      && JSON.stringify(existing?.[field]) !== JSON.stringify(savedMember[field])
  );
  const action = requestedAction || (existing ? 'updated' : 'created');
  const transaction = await database.transaction('write');
  try {
    await transaction.execute({
      sql: `INSERT INTO member_profiles (id, order_index, archived, profile_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          order_index = excluded.order_index,
          archived = excluded.archived,
          profile_json = excluded.profile_json,
          updated_at = excluded.updated_at`,
      args: [
        savedMember.id,
        savedMember.order,
        savedMember.archived ? 1 : 0,
        JSON.stringify(savedMember),
        savedMember.updatedAt,
      ],
    });
    await transaction.execute({
      sql: `INSERT INTO member_audit_log
        (id, member_id, member_name, action, actor, changed_fields, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        savedMember.id,
        savedMember.name || savedMember.ign,
        action,
        actor.email || 'Admin',
        JSON.stringify(changedFields),
        savedMember.updatedAt,
      ],
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  return savedMember;
}

function validateActivityRecord(collectionName, record, id) {
  if (!ACTIVITY_COLLECTIONS.has(collectionName)) {
    throw new ApiError(404, 'Activity collection not found.');
  }
  if (!record || typeof record !== 'object' || Array.isArray(record) || record.id !== id) {
    throw new ApiError(400, 'Activity record ID in the URL and request body must match.');
  }
  const isText = (value, maxLength, required = false) =>
    typeof value === 'string' && value.length <= maxLength && (!required || value.trim().length > 0);
  const isDate = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

  if (collectionName === 'announcements') {
    if (!isText(record.title, 120, true) || !isText(record.body, 3000, true) || !isDate(record.createdAt)) {
      throw new ApiError(400, 'Announcement details are invalid.');
    }
    return record.createdAt;
  }
  if (collectionName === 'events') {
    if (
      !isText(record.title, 120, true)
      || !isText(record.description ?? '', 1500)
      || !isText(record.location ?? '', 150)
      || !isDate(record.startsAt)
      || !isDate(record.createdAt)
    ) {
      throw new ApiError(400, 'Event details are invalid.');
    }
    return record.startsAt;
  }
  if (
    !isText(record.tournament, 120, true)
    || !isText(record.placement, 40, true)
    || typeof record.date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)
    || !isText(record.notes ?? '', 1200)
    || !Array.isArray(record.memberIds)
    || record.memberIds.length > 100
    || !record.memberIds.every((memberId) => typeof memberId === 'string' && memberId.length <= 128)
    || !isDate(record.createdAt)
  ) {
    throw new ApiError(400, 'Tournament result details are invalid.');
  }
  return record.date;
}

app.get('/api/health', route(async (_request, response) => {
  await database.execute('SELECT 1');
  response.json({ status: 'ok' });
}));

app.get('/api/activity/:collection', route(async (request, response) => {
  const { collection } = request.params;
  if (!ACTIVITY_COLLECTIONS.has(collection)) throw new ApiError(404, 'Activity collection not found.');
  const direction = collection === 'events' ? 'ASC' : 'DESC';
  const result = await database.execute({
    sql: `SELECT record_json FROM clan_activity_records
      WHERE collection_name = ? ORDER BY sort_at ${direction}`,
    args: [collection],
  });
  response.json(result.rows.map((row) => JSON.parse(row.record_json)));
}));

app.put('/api/activity/:collection/:id', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager', 'moderator']);
  const { collection, id } = request.params;
  const record = request.body;
  const sortAt = validateActivityRecord(collection, record, id);
  const savedRecord = { ...record, createdBy: actor.email || 'Admin' };
  await database.execute({
    sql: `INSERT INTO clan_activity_records (collection_name, id, sort_at, record_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(collection_name, id) DO UPDATE SET
        sort_at = excluded.sort_at,
        record_json = excluded.record_json,
        updated_at = excluded.updated_at`,
    args: [collection, id, sortAt, JSON.stringify(savedRecord), new Date().toISOString()],
  });
  response.json(savedRecord);
}));

app.delete('/api/activity/:collection/:id', route(async (request, response) => {
  await requireRole(request, ['owner', 'roster_manager', 'moderator']);
  const { collection, id } = request.params;
  if (!ACTIVITY_COLLECTIONS.has(collection)) throw new ApiError(404, 'Activity collection not found.');
  await database.execute({
    sql: 'DELETE FROM clan_activity_records WHERE collection_name = ? AND id = ?',
    args: [collection, id],
  });
  response.status(204).end();
}));

app.get('/api/members', route(async (request, response) => {
  const metadata = await database.execute(
    'SELECT id, order_index, updated_at FROM member_profiles ORDER BY order_index ASC'
  );
  const etag = `"${createHash('sha256').update(JSON.stringify(metadata.rows)).digest('hex')}"`;
  response.set('ETag', etag);
  if (request.get('if-none-match') === etag) {
    response.status(304).end();
    return;
  }
  const result = await database.execute(
    'SELECT profile_json FROM member_profiles ORDER BY order_index ASC'
  );
  response.json(result.rows.map((row) => JSON.parse(row.profile_json)));
}));

app.get('/api/clan-settings', route(async (_request, response) => {
  const result = await database.execute({
    sql: 'SELECT settings_json FROM clan_settings WHERE id = ? LIMIT 1',
    args: ['general'],
  });
  response.json(result.rows[0] ? JSON.parse(result.rows[0].settings_json) : null);
}));

app.put('/api/clan-settings', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager']);
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new ApiError(400, 'Clan settings must be an object.');
  }
  const settings = { ...request.body, updatedAt: new Date().toISOString() };
  await database.execute({
    sql: `INSERT INTO clan_settings (id, settings_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        settings_json = excluded.settings_json,
        updated_at = excluded.updated_at`,
    args: ['general', JSON.stringify(settings), settings.updatedAt],
  });
  response.json({ ...settings, updatedBy: actor.email });
}));

app.put('/api/members/:id', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager']);
  if (request.body?.id !== request.params.id) {
    throw new ApiError(400, 'Member ID in the URL and request body must match.');
  }
  const requestedAction = request.get('x-audit-action') === 'imported' ? 'imported' : undefined;
  response.json(await writeMember(request.body, actor, requestedAction));
}));

app.patch('/api/members/:id', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager']);
  const existingResult = await database.execute({
    sql: 'SELECT profile_json FROM member_profiles WHERE id = ? LIMIT 1',
    args: [request.params.id],
  });
  if (!existingResult.rows[0]) throw new ApiError(404, 'Member not found.');
  const existing = JSON.parse(existingResult.rows[0].profile_json);
  response.json(await writeMember({ ...existing, ...request.body, id: request.params.id }, actor));
}));

app.delete('/api/members/:id', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager']);
  const existingResult = await database.execute({
    sql: 'SELECT profile_json FROM member_profiles WHERE id = ? LIMIT 1',
    args: [request.params.id],
  });
  if (!existingResult.rows[0]) throw new ApiError(404, 'Member not found.');
  const member = JSON.parse(existingResult.rows[0].profile_json);
  const transaction = await database.transaction('write');
  try {
    await transaction.execute({
      sql: 'DELETE FROM member_profiles WHERE id = ?',
      args: [request.params.id],
    });
    await transaction.execute({
      sql: `INSERT INTO member_audit_log
        (id, member_id, member_name, action, actor, changed_fields, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        member.id,
        member.name || member.ign,
        'deleted',
        actor.email || 'Admin',
        '[]',
        new Date().toISOString(),
      ],
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  response.status(204).end();
}));

app.patch('/api/members/:id/archive', route(async (request, response) => {
  const actor = await requireRole(request, ['owner', 'roster_manager']);
  if (typeof request.body?.archived !== 'boolean') {
    throw new ApiError(400, 'Archived status must be a boolean.');
  }
  const existingResult = await database.execute({
    sql: 'SELECT profile_json FROM member_profiles WHERE id = ? LIMIT 1',
    args: [request.params.id],
  });
  if (!existingResult.rows[0]) throw new ApiError(404, 'Member not found.');
  const member = JSON.parse(existingResult.rows[0].profile_json);
  const action = request.body.archived ? 'archived' : 'restored';
  response.json(await writeMember({ ...member, archived: request.body.archived }, actor, action));
}));

app.get('/api/member-audit', route(async (request, response) => {
  await requireRole(request, ['owner', 'roster_manager']);
  const result = await database.execute(
    `SELECT id, member_id, member_name, action, actor, changed_fields, created_at
      FROM member_audit_log ORDER BY created_at DESC LIMIT 100`
  );
  response.json(result.rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    action: row.action,
    actor: row.actor,
    changedFields: JSON.parse(row.changed_fields),
    createdAt: row.created_at,
  })));
}));

app.put('/api/admin-roles/:uid', route(async (request, response) => {
  await requireRole(request, ['owner']);
  const { email, role } = request.body || {};
  if (
    typeof email !== 'string'
    || email.length > 254
    || typeof role !== 'string'
    || !VALID_ROLES.has(role)
    || !/^[a-zA-Z0-9_-]{1,128}$/.test(request.params.uid)
  ) {
    throw new ApiError(400, 'Admin account details are invalid.');
  }
  await database.execute({
    sql: `INSERT INTO admin_roles (firebase_uid, email, role, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(firebase_uid) DO UPDATE SET
        email = excluded.email,
        role = excluded.role,
        updated_at = excluded.updated_at`,
    args: [request.params.uid, email.trim().toLowerCase(), role, new Date().toISOString()],
  });
  response.status(204).end();
}));

app.delete('/api/admin-roles/:uid', route(async (request, response) => {
  const actor = await requireRole(request, ['owner']);
  if (request.params.uid === (actor.uid || actor.sub)) {
    throw new ApiError(400, 'You cannot remove your own admin role.');
  }
  await database.execute({
    sql: 'DELETE FROM admin_roles WHERE firebase_uid = ?',
    args: [request.params.uid],
  });
  response.status(204).end();
}));

app.post('/api/admin-roles/sync', route(async (request, response) => {
  await requireRole(request, ['owner']);
  const accounts = request.body?.accounts;
  if (!Array.isArray(accounts) || accounts.some((account) =>
    !account
      || typeof account.uid !== 'string'
      || !/^[a-zA-Z0-9_-]{1,128}$/.test(account.uid)
      || typeof account.email !== 'string'
      || account.email.length > 254
      || typeof account.role !== 'string'
      || !VALID_ROLES.has(account.role)
  )) {
    throw new ApiError(400, 'Admin role list is invalid.');
  }
  const transaction = await database.transaction('write');
  try {
    await transaction.execute('DELETE FROM admin_roles');
    for (const account of accounts) {
      await transaction.execute({
        sql: `INSERT INTO admin_roles (firebase_uid, email, role, updated_at)
          VALUES (?, ?, ?, ?)`,
        args: [account.uid, account.email.trim().toLowerCase(), account.role, new Date().toISOString()],
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  response.status(204).end();
}));

app.post('/api/admin/migrate/member/:id', route(async (request, response) => {
  const actor = await requireRole(request, ['owner']);
  if (request.body?.id !== request.params.id) {
    throw new ApiError(400, 'Member ID in the URL and request body must match.');
  }
  const existing = await database.execute({
    sql: 'SELECT profile_json FROM member_profiles WHERE id = ? LIMIT 1',
    args: [request.params.id],
  });
  if (existing.rows[0]) {
    response.json({ copied: false });
    return;
  }
  await writeMember(request.body, actor, 'imported');
  response.json({ copied: true });
}));

app.post('/api/admin/migrate/audit/:id', route(async (request, response) => {
  await requireRole(request, ['owner']);
  const entry = request.body;
  if (
    !entry
    || typeof entry.memberId !== 'string'
    || typeof entry.memberName !== 'string'
    || typeof entry.actor !== 'string'
    || typeof entry.createdAt !== 'string'
    || !Array.isArray(entry.changedFields)
    || !entry.changedFields.every((field) => typeof field === 'string')
    || !['created', 'updated', 'archived', 'restored', 'deleted', 'imported'].includes(entry.action)
  ) {
    throw new ApiError(400, 'Audit entry is invalid.');
  }
  const result = await database.execute({
    sql: `INSERT OR IGNORE INTO member_audit_log
      (id, member_id, member_name, action, actor, changed_fields, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      request.params.id,
      entry.memberId,
      entry.memberName,
      entry.action,
      entry.actor,
      JSON.stringify(entry.changedFields),
      entry.createdAt,
    ],
  });
  response.json({ copied: result.rowsAffected > 0 });
}));

app.post('/api/admin/migrate/settings', route(async (request, response) => {
  await requireRole(request, ['owner']);
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new ApiError(400, 'Clan settings must be an object.');
  }
  const settings = { ...request.body, updatedAt: new Date().toISOString() };
  const result = await database.execute({
    sql: `INSERT OR IGNORE INTO clan_settings (id, settings_json, updated_at)
      VALUES (?, ?, ?)`,
    args: ['general', JSON.stringify(settings), settings.updatedAt],
  });
  response.json({ copied: result.rowsAffected > 0 });
}));

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distributionDirectory = path.join(projectRoot, 'dist');
if (existsSync(distributionDirectory)) {
  app.use(express.static(distributionDirectory));
  app.get('*', (_request, response) => response.sendFile(path.join(distributionDirectory, 'index.html')));
}

app.use((error, _request, response, _next) => {
  const status = error instanceof ApiError
    ? error.status
    : Number.isInteger(error.status) && error.status < 500 ? error.status : 500;
  if (status === 500) console.error('API request failed:', error);
  response.status(status).json({
    error: error instanceof ApiError
      ? error.message
      : status === 413 ? 'The request is too large.' : 'The server could not complete the request.',
  });
});

await initializeDatabase();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VALKYR API listening on port ${PORT}`);
});
