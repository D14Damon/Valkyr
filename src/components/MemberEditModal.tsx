import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Trash2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { ClanMember, ClanDepartment, MemberStatus } from '../types/clan';
import {
  fileToBase64Optimized,
  getBase64SizeKb,
  MAX_TURSO_PHOTO_LENGTH,
} from '../utils/imageCompressor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  member: ClanMember | null;
  onSave: (member: ClanMember) => Promise<void>;
  existingCount: number;
}

const DEPARTMENTS: ClanDepartment[] = [
  'Executive',
  'Management',
  'Pro Player',
  'Content Creator',
  'Sniper',
  'Competitive Roster',
  'Community & Staff',
];

const STATUSES: MemberStatus[] = ['Active', 'Reserve', 'Alumni', 'Probationary'];

export function MemberEditModal({
  isOpen,
  onClose,
  member,
  onSave,
  existingCount,
}: Props) {
  const isEditing = Boolean(member);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(member?.name || '');
  const [ign, setIgn] = useState(member?.ign || '');
  const [clanTag, setClanTag] = useState(member?.clanTag || 'VALKYR');
  const [department, setDepartment] = useState<string>(
    member?.department || 'Pro Player'
  );
  const [role, setRole] = useState(member?.role || '');
  const [game, setGame] = useState(member?.game || 'Cross-Platform');
  const [status, setStatus] = useState<MemberStatus>(member?.status || 'Active');
  const [joinDate, setJoinDate] = useState(
    member?.joinDate ||
      new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );
  const [verificationCode, setVerificationCode] = useState(
    member?.verificationCode || `VKR-${String(existingCount + 1).padStart(3, '0')}`
  );
  const [bio, setBio] = useState(member?.bio || '');
  const [photoBase64, setPhotoBase64] = useState(member?.photoBase64 || '');
  const [twitter, setTwitter] = useState(member?.socials?.twitter || '');
  const [tiktok, setTiktok] = useState(member?.socials?.tiktok || '');
  const [facebook, setFacebook] = useState(member?.socials?.facebook || '');
  const [instagram, setInstagram] = useState(member?.socials?.instagram || '');
  const [youtube, setYoutube] = useState(member?.socials?.youtube || '');

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.currentTarget.value = '';

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please select a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setIsProcessingImage(true);
      setErrorMessage(null);
      const compressedBase64 = await fileToBase64Optimized(file, 900, 900, 0.86);
      setPhotoBase64(compressedBase64);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to process image. Please try a different photo.'
      );
      console.error(err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ign.trim() || !role.trim()) {
      setErrorMessage('Please fill in Name, IGN, and Role.');
      return;
    }
    if (
      photoBase64 &&
      photoBase64 !== '/valkyr-logo.png' &&
      (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photoBase64) ||
        photoBase64.length > MAX_TURSO_PHOTO_LENGTH)
    ) {
      setErrorMessage('Upload a JPG, PNG, or WebP photo so it can be saved as Base64 in Turso.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updatedMember: ClanMember = {
      id: member?.id || `vkr-${Date.now().toString(36)}`,
      name: name.trim(),
      ign: ign.trim(),
      clanTag: clanTag.trim() || 'VALKYR',
      department,
      role: role.trim(),
      game: game.trim(),
      status,
      verified: true,
      verificationCode: verificationCode.trim(),
      joinDate: joinDate.trim(),
      bio: bio.trim(),
      photoBase64: photoBase64 || '/valkyr-logo.png',
      socials: {
        ...(twitter.trim() && { twitter: twitter.trim() }),
        ...(tiktok.trim() && { tiktok: tiktok.trim() }),
        ...(facebook.trim() && { facebook: facebook.trim() }),
        ...(instagram.trim() && { instagram: instagram.trim() }),
        ...(youtube.trim() && { youtube: youtube.trim() }),
      },
      order: member?.order ?? existingCount + 1,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(updatedMember);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save member to Firebase.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const imageSizeKb = getBase64SizeKb(photoBase64);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? `Edit Member: ${member?.ign}` : 'Add Clan Member'}
              </h3>
              <p className="text-xs text-zinc-400">
                Member profile and photo saved to Turso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo Upload Section (Base64) */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Member Photo (Base64 String)
                </label>
                <p className="text-[11px] text-zinc-400">
                  Select a photo from your device. It will be resized to 900px and saved in Turso.
                </p>
              </div>
              {photoBase64.startsWith('data:') && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  Size: ~{imageSizeKb} KB
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Photo Preview Container */}
              <div className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0 group">
                {photoBase64 ? (
                  <img
                    src={photoBase64}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] mt-1">No Image</span>
                  </div>
                )}
                {photoBase64 && (
                  <button
                    type="button"
                    onClick={() => setPhotoBase64('')}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-red-400 hover:text-red-300 transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                  >
                    <Upload className="w-4 h-4" />
                    {isProcessingImage ? 'Compressing...' : 'Upload Member Photo'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoBase64('/valkyr-logo.png')}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
                  >
                    Use Clan Logo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member Details Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Real Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                In-Game Name (IGN) *
              </label>
              <input
                type="text"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="e.g. Valkyr Nova"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Department / Division *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Clan Role / Title *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Captain, Entry Fragger, Streamer"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Game / Discipline
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g. Call Of Duty: Mobile, Valorant"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="e.g. VKR-001"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Induction Date
              </label>
              <input
                type="text"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Member Bio / Profile (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief player bio or achievements..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="pt-2 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Social Links (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="TikTok profile URL"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="YouTube channel URL"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="Facebook page URL"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="Twitter / X profile URL"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingImage}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-purple-950/40 transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving to Database...' : isEditing ? 'Save Changes' : 'Add to Directory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
