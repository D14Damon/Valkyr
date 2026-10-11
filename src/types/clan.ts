export type MemberStatus = 'Active' | 'Reserve' | 'Alumni' | 'Probationary';

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
  updatedAt?: string;
}

export type ViewMode = 'grid' | 'department' | 'list';
