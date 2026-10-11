export type MemberStatus = 'Active' | 'Reserve' | 'Alumni' | 'Probationary';
export type AdminRole = 'owner' | 'roster_manager' | 'moderator';

export interface ClanAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ClanEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location?: string;
  createdAt: string;
  createdBy?: string;
}

export interface TournamentResult {
  id: string;
  tournament: string;
  placement: string;
  date: string;
  notes?: string;
  memberIds: string[];
  createdAt: string;
  createdBy?: string;
}

export interface RecruitmentApplication {
  id: string;
  name: string;
  ign: string;
  game: string;
  role: string;
  contact: string;
  message: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface ImpersonationReport {
  id: string;
  reportedAccount: string;
  platform: string;
  evidenceUrl?: string;
  details: string;
  contact?: string;
  status: 'open' | 'reviewing' | 'resolved';
  createdAt: string;
}

export interface MemberAuditEntry {
  id: string;
  memberId: string;
  memberName: string;
  action: 'created' | 'updated' | 'archived' | 'restored' | 'deleted' | 'imported';
  actor: string;
  changedFields: string[];
  createdAt: string;
}

export interface AdminAccount {
  uid: string;
  email: string;
  role: AdminRole;
  createdAt: string;
}

export type ClanDepartment =
  | 'Executive'
  | 'Management'
  | 'Pro Player'
  | 'Content Creator'
  | 'Sniper'
  | 'Competitive Roster'
  | 'Community & Staff';

export interface ClanMember {
  id: string;
  name: string;
  ign: string;
  clanTag?: string;
  department: ClanDepartment | string;
  role: string;
  photoBase64: string;
  status: MemberStatus;
  verified: boolean;
  verificationCode: string;
  game: string;
  joinDate: string;
  bio?: string;
  socials?: {
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    discord?: string;
  };
  order: number;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ClanSettings {
  name: string;
  tagline: string;
  description: string;
  established: string;
  region: string;
  logoBase64?: string;
  bannerBase64?: string;
  discordUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  announcement?: string;
  recruitmentOpen?: boolean;
  recruitingRoles?: string[];
  verificationInstructions?: string;
  clanRules?: string;
  faq?: { question: string; answer: string }[];
  updatedAt?: string;
}

export type ViewMode = 'grid' | 'department' | 'list';
