import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AppShell } from '../../components/navigation/AppShell';
import { useAuth } from '../../context/AuthContext';
import { useHome } from '../../context/HomeContext';
import type { TempUnit, ThemePreference } from '../../types/home';
import { getInitials } from '../../utils/format';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { authMode, signOut } = useAuth();
  const { state, updateProfile, addRoom, removeRoom, exportTelemetryJson, showToast } = useHome();

  const profile = state.profile;

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState(profile.displayName);
  const [residenceDraft, setResidenceDraft] = useState(profile.residenceName);

  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const [tariffEditOpen, setTariffEditOpen] = useState(false);
  const [tariffBaseDraft, setTariffBaseDraft] = useState(String(profile.tariffBase));
  const [tariffPeakDraft, setTariffPeakDraft] = useState(String(profile.tariffPeak));

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameDraft.trim() || !residenceDraft.trim()) return;
    await updateProfile({
      displayName: displayNameDraft.trim(),
      residenceName: residenceDraft.trim(),
    });
    setEditProfileOpen(false);
    showToast('Profile settings updated', 'success');
  };

  const handleSaveTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = Math.max(0.5, Number(tariffBaseDraft) || 4.2);
    const peak = Math.max(base, Number(tariffPeakDraft) || 9.8);
    await updateProfile({ tariffBase: base, tariffPeak: peak });
    setTariffEditOpen(false);
    showToast('Energy tariff matrix updated', 'success');
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    await addRoom(newRoomName.trim(), 'meeting_room');
    setNewRoomName('');
  };

  const handleSignOut = async () => {
    await signOut();
    setSignOutConfirmOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      headerMode="stack"
      title="Settings"
      subtitle="Residence & system preferences"
      backTo="/"
    >
      <div className="space-y-5 pb-8 font-gellix">
        {/* Profile Card */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline text-on-surface flex items-center justify-center text-text-s font-semibold shrink-0">
              {getInitials(profile.displayName)}
            </div>
            <div className="min-w-0">
              <div className="text-text-s font-semibold text-on-surface truncate">
                {profile.displayName}
              </div>
              <div className="text-text-xs text-on-surface-variant truncate">{profile.email}</div>
              <div className="text-text-xs text-accent-text font-medium mt-0.5 truncate">
                {profile.residenceName} · {profile.role}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setDisplayNameDraft(profile.displayName);
              setResidenceDraft(profile.residenceName);
              setEditProfileOpen(true);
            }}
          >
            Edit
          </Button>
        </section>

        {/* Environment & Rooms */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <h2 className="text-eyebrow-s text-on-surface-variant">Environment</h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-text-s font-semibold text-on-surface">
                {profile.residenceName}
              </div>
              <div className="text-text-xs text-on-surface-variant tabular-nums">
                {state.rooms.length} configured zones · {state.devices.length} registered nodes
              </div>
            </div>
            <Button variant="secondary" size="small" onClick={() => setRoomsModalOpen(true)}>
              Manage rooms
            </Button>
          </div>
        </section>

        {/* Link Telemetry */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-2">
          <h2 className="text-eyebrow-s text-on-surface-variant mb-1">Link telemetry</h2>
          <div className="divide-y divide-outline text-text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Device bridge</span>
              <span className="font-semibold text-accent-text">Simulated MQTT / Zigbee</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Local hub firmware</span>
              <span className="font-semibold text-on-surface">Aware-Hub v2.4.1</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Account persistence</span>
              <span className="font-semibold text-on-surface">
                {authMode === 'firebase' ? 'Cloud account sync' : 'Local browser session'}
              </span>
            </div>
          </div>
        </section>

        {/* Notifications & Alerts */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <h2 className="text-eyebrow-s text-on-surface-variant">Notifications & alerts</h2>
          {[
            {
              key: 'notifySecurity' as const,
              label: 'Perimeter security alerts',
              desc: 'Immediate alerts for motion or entry events',
              value: profile.notifySecurity,
            },
            {
              key: 'notifyEnergy' as const,
              label: 'Peak tariff advisories',
              desc: 'Notify when grid load enters peak window',
              value: profile.notifyEnergy,
            },
            {
              key: 'notifyOffline' as const,
              label: 'Offline device diagnostics',
              desc: 'Alert if a smart node drops from mesh bridge',
              value: profile.notifyOffline,
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 py-1">
              <div>
                <div className="text-text-xs font-semibold text-on-surface">{item.label}</div>
                <div className="text-text-xs font-normal text-on-surface-variant">{item.desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.value}
                onClick={() => updateProfile({ [item.key]: !item.value })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                  item.value ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    item.value ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </section>

        {/* Preferences & Calibration */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-4">
          <h2 className="text-eyebrow-s text-on-surface-variant">Preferences & calibration</h2>

          <div className="space-y-2">
            <div className="text-text-xs font-semibold text-on-surface">Interface theme</div>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'auto'] as ThemePreference[]).map((t) => (
                <Button
                  key={t}
                  variant={profile.theme === t ? 'primary' : 'secondary'}
                  onClick={() => updateProfile({ theme: t })}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline">
            <div>
              <div className="text-text-xs font-semibold text-on-surface">Thermal metrics</div>
              <div className="text-text-xs font-normal text-on-surface-variant">
                Applies across Dashboard, Devices & Thermostat
              </div>
            </div>
            <div className="inline-flex gap-1 p-1 rounded-lg bg-surface border border-outline">
              {(['C', 'F'] as TempUnit[]).map((u) => (
                <Button
                  key={u}
                  variant={profile.tempUnit === u ? 'primary' : 'tertiary-alt'}
                  size="small"
                  onClick={() => updateProfile({ tempUnit: u })}
                >
                  °{u}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline">
            <div>
              <div className="text-text-xs font-semibold text-on-surface">Energy tariff matrix</div>
              <div className="text-text-xs font-normal text-on-surface-variant tabular-nums">
                Off-Peak ₹{profile.tariffBase.toFixed(1)}/kWh · Peak ₹
                {profile.tariffPeak.toFixed(1)}/kWh
              </div>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setTariffBaseDraft(String(profile.tariffBase));
                setTariffPeakDraft(String(profile.tariffPeak));
                setTariffEditOpen(true);
              }}
            >
              Modify
            </Button>
          </div>
        </section>

        {/* Privacy & Data Pipeline */}
        <section className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
          <h2 className="text-eyebrow-s text-on-surface-variant">Privacy & data pipeline</h2>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-text-xs font-semibold text-on-surface">
                Strict local hub processing
              </div>
              <div className="text-text-xs font-normal text-on-surface-variant">
                Evaluate sensor telemetry locally before cloud optimization
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.localProcessing}
              onClick={() => updateProfile({ localProcessing: !profile.localProcessing })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                profile.localProcessing ? 'bg-amplitude-blue' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  profile.localProcessing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <Button variant="secondary" fullWidth className="h-10" onClick={exportTelemetryJson}>
            <span className="material-symbols-outlined text-[18px] text-accent-text">download</span>
            <span>Export telemetry archive (JSON)</span>
          </Button>
        </section>

        {/* Sign Out */}
        <Button
          variant="secondary"
          isDanger
          fullWidth
          className="h-10"
          onClick={() => setSignOutConfirmOpen(true)}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign out</span>
        </Button>
      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditProfileOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-text-m font-semibold text-on-surface mb-4">Edit profile & home</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-text-xs text-on-surface-variant mb-1">
                  Display name
                </label>
                <input
                  type="text"
                  required
                  value={displayNameDraft}
                  onChange={(e) => setDisplayNameDraft(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface"
                />
              </div>
              <div>
                <label className="block text-text-xs text-on-surface-variant mb-1">
                  Residence name
                </label>
                <input
                  type="text"
                  required
                  value={residenceDraft}
                  onChange={(e) => setResidenceDraft(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Rooms Modal */}
      {roomsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setRoomsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-surface-container border border-outline p-5 shadow-2xl space-y-4 font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-text-m font-semibold text-on-surface">Manage rooms & zones</h3>
              <Button
                variant="tertiary-alt"
                size="small"
                iconOnly
                onClick={() => setRoomsModalOpen(false)}
                aria-label="Close rooms modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>

            <form onSubmit={handleAddRoom} className="flex gap-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="New room name..."
                className="flex-1 h-9 px-3 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface"
              />
              <Button type="submit" variant="primary" className="h-9">
                Add
              </Button>
            </form>

            <div className="max-h-60 overflow-y-auto divide-y divide-outline">
              {state.rooms.map((room) => (
                <div key={room.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-accent-text">
                      {room.icon}
                    </span>
                    <div>
                      <div className="text-text-xs font-semibold text-on-surface">{room.name}</div>
                      <div className="text-text-xxs text-on-surface-variant">{room.zone}</div>
                    </div>
                  </div>
                  {state.rooms.length > 1 && (
                    <Button
                      variant="tertiary-alt"
                      size="small"
                      iconOnly
                      isDanger
                      onClick={() => removeRoom(room.id)}
                      aria-label={`Remove ${room.name}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tariff Matrix Modal */}
      {tariffEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setTariffEditOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-text-m font-semibold text-on-surface mb-4">Energy tariff matrix</h3>
            <form onSubmit={handleSaveTariff} className="space-y-3.5">
              <div>
                <label className="block text-text-xs text-on-surface-variant mb-1">
                  Off-Peak rate (₹/kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  required
                  value={tariffBaseDraft}
                  onChange={(e) => setTariffBaseDraft(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s text-on-surface tabular-nums"
                />
              </div>
              <div>
                <label className="block text-text-xs text-on-surface-variant mb-1">
                  Peak rate (₹/kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  value={tariffPeakDraft}
                  onChange={(e) => setTariffPeakDraft(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline text-text-s text-on-surface tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setTariffEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Update rates
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={signOutConfirmOpen}
        title="Sign out of Aware Home?"
        description="You will be returned to the login screen. Your synced settings remain stored."
        confirmLabel="Sign out"
        tone="danger"
        icon="logout"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutConfirmOpen(false)}
      />
    </AppShell>
  );
};
