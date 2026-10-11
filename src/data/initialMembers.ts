import { ClanMember, ClanSettings } from '../types/clan';

export const DEFAULT_CLAN_SETTINGS: ClanSettings = {
  name: 'VALKYR',
  tagline: 'Official Clan Member Directory',
  description: 'Official verified roster and member directory for VALKYR.',
  established: '2024',
  region: 'Global / SEA',
  logoBase64: '/valkyr-logo.png',
  announcement: '',
  updatedAt: new Date().toISOString(),
};

// No local dummy data - roster data is sourced from the Turso API.
export const INITIAL_MEMBERS: ClanMember[] = [];
