import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  UserPlus,
  Lock,
} from 'lucide-react';
import { ClanMember, ClanSettings, ViewMode } from './types/clan';
import { DEFAULT_CLAN_SETTINGS } from './data/initialMembers';
import {
  subscribeToMembers,
  saveMember,
  deleteMember,
  getClanSettings,
} from './services/memberService';
import { testConnection, auth, onAuthStateChanged, signOut } from './firebase';

import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { RosterControls } from './components/RosterControls';
import { MemberCard } from './components/MemberCard';
import { MemberModal } from './components/MemberModal';
import { MemberEditModal } from './components/MemberEditModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { LegitimacyCheckerModal } from './components/LegitimacyCheckerModal';
import { RosterTableView } from './components/RosterTableView';
import { Footer } from './components/Footer';

export default function App() {
  // Pure database state: starts empty, strictly loaded from Firestore
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [settings, setSettings] = useState<ClanSettings>(DEFAULT_CLAN_SETTINGS);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('rank');

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);

  // Modals state
  const [inspectMember, setInspectMember] = useState<ClanMember | null>(null);
  const [editMember, setEditMember] = useState<ClanMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isLegitimacyCheckerOpen, setIsLegitimacyCheckerOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Connection & Realtime Member Subscription from Firestore
  useEffect(() => {
    testConnection();

    // Fetch Clan Settings
    getClanSettings().then(setSettings).catch(console.warn);

    // Realtime subscription to members collection in Firestore
    const unsubscribe = subscribeToMembers(
      (updatedMembers) => {
        setMembers(updatedMembers);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
        setAdminEmail(user.email || undefined);
      }
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
      showToast(`Saved ${memberToSave.ign} directly to Firestore!`);
    } catch (err) {
      console.error(err);
      showToast(`Error saving member: ${err instanceof Error ? err.message : 'Permission denied'}`);
      throw err;
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

  // Admin Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsAdmin(false);
    setAdminEmail(undefined);
    showToast('Signed out of admin mode.');
  };

  // Distinct Departments with member counts
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      if (m.department) {
        counts[m.department] = (counts[m.department] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [members]);

  // Filter and Sort members
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

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
  }, [members, searchQuery, selectedDepartment, sortOption]);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 px-4 rounded-xl bg-zinc-900 border border-purple-500/50 shadow-2xl shadow-purple-950/40 text-xs font-semibold text-white flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Official Header */}
      <Header
        settings={settings}
        isAdmin={isAdmin}
        onOpenLegitimacyChecker={() => setIsLegitimacyCheckerOpen(true)}
        onOpenAddMember={() => {
          setEditMember(null);
          setIsEditModalOpen(true);
        }}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        memberCount={members.length}
      />

      {/* Hero Banner with VALKYR Emblem */}
      <HeroBanner
        settings={settings}
        memberCount={members.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenLegitimacyChecker={() => setIsLegitimacyCheckerOpen(true)}
      />

      {/* Main Roster Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Roster Controls: Only show when there are members */}
        {members.length > 0 && (
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
        )}

        {/* Members Content Display */}
        <div className={members.length > 0 ? 'mt-8' : ''}>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm font-mono">Connecting to VALKYR live database...</p>
            </div>
          ) : members.length === 0 ? (
            /* Clean Empty Database State (Zero local fake data) */
            <div className="py-20 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 mx-auto mb-4 p-1">
                <img
                  src="/valkyr-logo.png"
                  alt="VALKYR Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <h3 className="text-lg font-bold text-white">No Clan Members in Database Yet</h3>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Your directory is cleanly connected to Firebase. Start populating the roster by adding real clan members and custom photos from the dashboard.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setEditMember(null);
                      setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add First Clan Member</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAdminAuthOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Admin Login to Add Members</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredAndSortedMembers.length === 0 ? (
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
              isAdmin={isAdmin}
              onEdit={(m) => {
                setEditMember(m);
                setIsEditModalOpen(true);
              }}
              onDelete={handleDeleteMember}
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

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {group.members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onSelect={setInspectMember}
                        isAdmin={isAdmin}
                        onEdit={(m) => {
                          setEditMember(m);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteMember}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Default All Members Grid View */
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredAndSortedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onSelect={setInspectMember}
                  isAdmin={isAdmin}
                  onEdit={(m) => {
                    setEditMember(m);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={handleDeleteMember}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <MemberModal
        member={inspectMember}
        onClose={() => setInspectMember(null)}
        isAdmin={isAdmin}
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
        onSignOut={handleSignOut}
        onRefreshRoster={() => {
          getClanSettings().then(setSettings);
          showToast('Data refreshed from Firestore.');
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

      <LegitimacyCheckerModal
        isOpen={isLegitimacyCheckerOpen}
        onClose={() => setIsLegitimacyCheckerOpen(false)}
        members={members}
        onSelectMember={setInspectMember}
      />

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenLegitimacyChecker={() => setIsLegitimacyCheckerOpen(true)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        isAdmin={isAdmin}
      />
    </div>
  );
}
