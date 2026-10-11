import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { AdminRole, ClanMember, ClanSettings, ViewMode } from './types/clan';
import { DEFAULT_CLAN_SETTINGS } from './data/initialMembers';
import {
  subscribeToMembers,
  saveMember,
  deleteMember,
  getClanSettings,
  migrateFirestoreProfiles,
  setMemberArchived,
} from './services/memberService';
import {
  testConnection,
  auth,
  getAdminRole,
  onAuthStateChanged,
  signOut,
} from './firebase';

import { Header } from './components/Header';
import { RealisticLavaBackground } from './components/RealisticLavaBackground';
import { RosterControls } from './components/RosterControls';
import { MemberCard } from './components/MemberCard';
import { MemberModal } from './components/MemberModal';
import { MemberEditModal } from './components/MemberEditModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { RosterTableView } from './components/RosterTableView';
import { CommunityHub } from './components/CommunityHub';

export default function App() {
  // Roster state is loaded from the live Turso API.
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [settings, setSettings] = useState<ClanSettings>(DEFAULT_CLAN_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('rank');

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);

  // Modals state
  const [inspectMember, setInspectMember] = useState<ClanMember | null>(null);
  const [editMember, setEditMember] = useState<ClanMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial connection and polling for Turso roster changes
  useEffect(() => {
    testConnection();

    // Fetch Clan Settings
    getClanSettings().then(setSettings).catch((error: unknown) => {
      console.error('Failed to load clan settings from Turso:', error);
      setRosterError(error instanceof Error ? error.message : 'Could not load clan settings.');
    });

    // ETags avoid redownloading unchanged profiles and their Base64 photos.
    const unsubscribe = subscribeToMembers(
      (updatedMembers) => {
        setMembers(updatedMembers);
        setLoading(false);
        setRosterError(null);
      },
      (error) => {
        setLoading(false);
        setRosterError(error instanceof Error ? error.message : 'Could not load the member roster.');
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(false);
      setAdminRole(null);
      setAdminEmail(undefined);
      if (!user) return;

      void getAdminRole(user)
        .then((role) => {
          if (auth.currentUser?.uid !== user.uid) return;
          if (role) {
            setIsAdmin(true);
            setAdminRole(role);
            setAdminEmail(user.email || undefined);
          } else {
            void signOut(auth).catch((error: unknown) => {
              console.error('Failed to sign out unauthorized account:', error);
            });
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to verify admin authorization:', error);
          if (auth.currentUser?.uid === user.uid) {
            void signOut(auth).catch((signOutError: unknown) => {
              console.error('Failed to sign out unauthorized account:', signOutError);
            });
          }
        });
    });
    return () => unsubAuth();
  }, []);

  // Check URL params on initial load for direct member links (e.g. ?member=vkr-001)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberParam = params.get('member');
    if (memberParam && members.length > 0) {
      const found = members.find((m) => m.id === memberParam);
      if (found) {
        setInspectMember(found);
      }
    }
  }, [members]);

  // Handle Save / Add Member
  const handleSaveMember = async (memberToSave: ClanMember) => {
    try {
      await saveMember(memberToSave, adminEmail);
      showToast(`Saved ${memberToSave.ign} to Turso.`);
    } catch (err) {
      console.error(err);
      showToast(`Error saving member: ${err instanceof Error ? err.message : 'Permission denied'}`);
      throw err;
    }
  };

  const handleImportMembers = async (newMembers: ClanMember[]) => {
    let importedCount = 0;
    try {
      for (const member of newMembers) {
        await saveMember(member, adminEmail, 'imported');
        importedCount += 1;
      }
      showToast(`Imported ${importedCount} members from CSV.`);
    } catch (error) {
      console.error('CSV import stopped after a save failure:', error);
      throw new Error(`Imported ${importedCount} of ${newMembers.length} members before the save failed. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId: string) => {
    const memberToDelete = members.find((m) => m.id === memberId);
    if (!window.confirm(`Are you sure you want to remove ${memberToDelete?.ign || 'this member'} from the official directory?`)) {
      return;
    }

    try {
      await deleteMember(memberId);
      showToast(`Removed ${memberToDelete?.ign} from database.`);
    } catch (err) {
      console.error(err);
      showToast(`Error removing member: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  };

  const handleArchiveMember = async (member: ClanMember) => {
    try {
      await setMemberArchived(member, !member.archived);
      showToast(`${member.ign} ${member.archived ? 'restored to' : 'archived from'} the active roster.`);
    } catch (error) {
      console.error(error);
      showToast(`Error updating member: ${error instanceof Error ? error.message : 'Failed'}`);
    }
  };

  // Admin Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Failed to sign out admin:', error);
      showToast(`Could not sign out: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }
    setIsAdmin(false);
    setAdminRole(null);
    setAdminEmail(undefined);
    showToast('Signed out of admin mode.');
  };

  // Distinct Departments with member counts
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.filter((member) => includeArchived || !member.archived).forEach((m) => {
      if (m.department) {
        counts[m.department] = (counts[m.department] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [members, includeArchived]);

  // Filter and Sort members
  const filteredAndSortedMembers = useMemo(() => {
    let result = members.filter((member) => includeArchived || !member.archived);

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.ign?.toLowerCase().includes(q) ||
          m.name?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q) ||
          m.department?.toLowerCase().includes(q) ||
          m.game?.toLowerCase().includes(q) ||
          m.verificationCode?.toLowerCase().includes(q)
      );
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      result = result.filter((m) => m.department === selectedDepartment);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'ign-asc':
          return (a.ign || '').localeCompare(b.ign || '');
        case 'ign-desc':
          return (b.ign || '').localeCompare(a.ign || '');
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'date-newest':
          return (b.joinDate || '').localeCompare(a.joinDate || '');
        case 'date-oldest':
          return (a.joinDate || '').localeCompare(b.joinDate || '');
        case 'rank':
        default:
          return (a.order ?? 999) - (b.order ?? 999);
      }
    });

    return result;
  }, [members, searchQuery, selectedDepartment, sortOption, includeArchived]);

  // Grouped members for "Department" View Mode
  const groupedByDepartment = useMemo(() => {
    const groups: { department: string; members: ClanMember[] }[] = [];
    const knownDepts = Array.from(new Set(filteredAndSortedMembers.map((m) => m.department || 'General')));

    knownDepts.forEach((dept) => {
      const matching = filteredAndSortedMembers.filter((m) => (m.department || 'General') === dept);
      if (matching.length > 0) {
        groups.push({ department: dept, members: matching });
      }
    });

    return groups;
  }, [filteredAndSortedMembers]);

  return (
    <>
      <RealisticLavaBackground />
      <div
        className="app-shell text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="app-content flex flex-col px-0" style={{ position: 'relative', zIndex: 20 }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-3.5 px-4 rounded-xl bg-zinc-900/80 border border-purple-500/50 shadow-2xl shadow-purple-950/40 text-xs font-semibold text-white flex items-center gap-2 animate-bounce backdrop-blur-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Official Header */}
        <Header
          settings={settings}
          isAdmin={isAdmin}
          canManageRoster={adminRole === 'owner' || adminRole === 'roster_manager'}
          onOpenAddMember={() => {
            setEditMember(null);
            setIsEditModalOpen(true);
          }}
          onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          memberCount={members.length}
        />

        {(loading || members.length > 0 || rosterError) && (
        <main id="member-roster" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {rosterError && (
            <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
              The live data service is unavailable: {rosterError}
            </div>
          )}
          {/* Roster Controls: Only show when there are members */}
          {members.length > 0 && (
            <>
            <RosterControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              departments={departmentCounts}
              sortOption={sortOption}
              onSortChange={setSortOption}
              totalFiltered={filteredAndSortedMembers.length}
            />
            {adminRole && (
              <label className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} className="accent-purple-500" />
                Include archived members ({members.filter((member) => member.archived).length})
              </label>
            )}
            </>
          )}

          {/* Members Content Display */}
          <div className={members.length > 0 ? 'mt-8' : ''}>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm font-mono">Connecting to VALKYR live database...</p>
            </div>
          ) : members.length > 0 ? (
            filteredAndSortedMembers.length === 0 ? (
            /* Search filter with no match */
            <div className="py-16 text-center bg-zinc-900/30 border border-zinc-850 rounded-2xl p-8">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Matching Members</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                No member matched your search query "{searchQuery || selectedDepartment}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
              >
                Clear Search
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Table Registry View */
            <RosterTableView
              members={filteredAndSortedMembers}
              onSelect={setInspectMember}
              isAdmin={adminRole === 'owner' || adminRole === 'roster_manager'}
              onEdit={(m) => {
                setEditMember(m);
                setIsEditModalOpen(true);
              }}
              onDelete={handleDeleteMember}
              onArchive={handleArchiveMember}
            />
          ) : viewMode === 'department' ? (
            /* Grouped by Department View */
            <div className="space-y-12">
              {groupedByDepartment.map((group) => (
                <div key={group.department} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-zinc-850">
                    <span className="text-purple-400 font-mono font-bold">◤</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                      {group.department}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {group.members.length} Members
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {group.members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onSelect={setInspectMember}
                        isAdmin={adminRole === 'owner' || adminRole === 'roster_manager'}
                        onEdit={(m) => {
                          setEditMember(m);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteMember}
                        onArchive={handleArchiveMember}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Default All Members Grid View */
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onSelect={setInspectMember}
                  isAdmin={adminRole === 'owner' || adminRole === 'roster_manager'}
                  onEdit={(m) => {
                    setEditMember(m);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={handleDeleteMember}
                  onArchive={handleArchiveMember}
                />
              ))}
            </div>
          )) : null}
        </div>
      </main>
        )}

        <CommunityHub
          members={members}
          settings={settings}
          adminRole={adminRole}
          adminEmail={adminEmail}
          onUpdateSettings={setSettings}
        />

      {/* Modals */}
      <MemberModal
        member={inspectMember}
        onClose={() => setInspectMember(null)}
        isAdmin={adminRole === 'owner' || adminRole === 'roster_manager'}
        onEdit={(m) => {
          setEditMember(m);
          setIsEditModalOpen(true);
        }}
      />

      <MemberEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditMember(null);
        }}
        member={editMember}
        onSave={handleSaveMember}
        existingCount={members.length}
      />

      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        members={members}
        adminEmail={adminEmail}
        adminRole={adminRole}
        onImportMembers={handleImportMembers}
        onMigrateFirestoreProfiles={migrateFirestoreProfiles}
        onSignOut={handleSignOut}
        onRefreshRoster={() => {
          void getClanSettings().then((updatedSettings) => {
            setSettings(updatedSettings);
            showToast('Clan settings refreshed from Turso.');
          }).catch((error: unknown) => {
            console.error('Failed to refresh clan settings:', error);
            showToast(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          });
        }}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onAdminAuthenticated={(email) => {
          setIsAdmin(true);
          setAdminEmail(email);
          showToast(`Admin unlocked: ${email}`);
        }}
      />

        </div>
      </div>
    </>
  );
}
