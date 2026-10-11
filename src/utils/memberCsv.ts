import { ClanMember, MemberStatus } from '../types/clan';

const CSV_FIELDS = [
  'name',
  'ign',
  'clanTag',
  'department',
  'role',
  'game',
  'status',
  'verificationCode',
  'joinDate',
  'bio',
] as const;

function parseCsvRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function membersToCsv(members: ClanMember[]): string {
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    CSV_FIELDS.join(','),
    ...members.map((member) => CSV_FIELDS.map((field) => quote(member[field])).join(',')),
  ].join('\r\n');
}

export function parseMemberCsv(source: string, startingOrder: number): ClanMember[] {
  const [headerRow, ...dataRows] = parseCsvRows(source);
  if (!headerRow) throw new Error('CSV file is empty.');

  const headers = headerRow.map((header) => header.trim().toLowerCase());
  const requiredFields = ['name', 'ign', 'department', 'role'];
  const missingField = requiredFields.find((field) => !headers.includes(field));
  if (missingField) {
    throw new Error(`CSV is missing the required "${missingField}" column.`);
  }

  const statusValues: MemberStatus[] = ['Active', 'Reserve', 'Alumni', 'Probationary'];
  return dataRows.map((values, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column]?.trim() || '']));
    for (const field of requiredFields) {
      if (!record[field]) throw new Error(`CSV row ${index + 2} is missing "${field}".`);
    }

    const requestedStatus = record.status || 'Active';
    if (!statusValues.includes(requestedStatus as MemberStatus)) {
      throw new Error(`CSV row ${index + 2} has an invalid status "${requestedStatus}".`);
    }

    return {
      id: `vkr-${Date.now().toString(36)}-${index.toString(36)}`,
      name: record.name,
      ign: record.ign,
      clanTag: record.clantag || 'VALKYR',
      department: record.department,
      role: record.role,
      photoBase64: '/valkyr-logo.png',
      status: requestedStatus as MemberStatus,
      verified: true,
      verificationCode: record.verificationcode || `VKR-${String(startingOrder + index + 1).padStart(3, '0')}`,
      game: record.game || 'Cross-Platform',
      joinDate: record.joindate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      bio: record.bio || '',
      order: startingOrder + index + 1,
    };
  });
}
