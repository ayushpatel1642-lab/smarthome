import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AppShell } from '../../components/navigation/AppShell';
import { useHome } from '../../context/HomeContext';

const DEVICE_TYPES = [
  {
    type: 'light',
    label: 'Smart Light',
    category: 'lighting',
    icon: 'lightbulb',
    defaultName: 'Ambient Ceiling Light',
  },
  {
    type: 'ac',
    label: 'Smart Inverter AC',
    category: 'climate',
    icon: 'ac_unit',
    defaultName: 'Inverter Split AC',
  },
  {
    type: 'lock',
    label: 'Smart Lock',
    category: 'security',
    icon: 'lock',
    defaultName: 'Biometric Entry Lock',
  },
  {
    type: 'motion_sensor',
    label: 'Motion Sensor',
    category: 'security',
    icon: 'sensors',
    defaultName: 'Radar Motion Sensor',
  },
  {
    type: 'door_sensor',
    label: 'Door / Window Sensor',
    category: 'security',
    icon: 'sensor_door',
    defaultName: 'Perimeter Contact Sensor',
  },
  {
    type: 'plug',
    label: 'Smart Plug',
    category: 'appliance',
    icon: 'power',
    defaultName: 'Energy Meter Plug',
  },
];

const PROTOCOLS = ['Simulated MQTT', 'Simulated Zigbee 3.0', 'Simulated Thread'];

export const AddDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, addDevice, addRoom } = useHome();

  const [step, setStep] = useState<1 | 2 | 3>(2);
  const [selectedType, setSelectedType] = useState(DEVICE_TYPES[0]);
  const [deviceName, setDeviceName] = useState(DEVICE_TYPES[0].defaultName);
  const [protocol, setProtocol] = useState(PROTOCOLS[0]);
  const [selectedRoomName, setSelectedRoomName] = useState(
    state.rooms[0]?.name || 'Living Room'
  );
  const [pairing, setPairing] = useState(false);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleSelectType = (item: (typeof DEVICE_TYPES)[number]) => {
    setSelectedType(item);
    setDeviceName(item.defaultName);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRoomName.trim();
    if (!clean) return;
    const created = await addRoom(clean, 'meeting_room');
    if (created) {
      setSelectedRoomName(created.name);
    }
    setNewRoomName('');
    setRoomModalOpen(false);
  };

  const handleConnect = async () => {
    setPairing(true);
    const matchedRoom = state.rooms.find((r) => r.name === selectedRoomName);
    await new Promise((r) => setTimeout(r, 450));
    const created = await addDevice({
      name: deviceName.trim() || selectedType.defaultName,
      subtitle: `${selectedRoomName} · ${protocol}`,
      roomId: matchedRoom?.id ?? null,
      roomName: selectedRoomName,
      category: selectedType.category,
      deviceType: selectedType.type,
      icon: selectedType.icon,
      protocol,
    });
    setPairing(false);
    if (created) {
      navigate('/devices');
    }
  };

  return (
    <AppShell
      headerMode="stack"
      title="Add device"
      subtitle="Simulated IoT onboarding"
      backTo="/devices"
      hideBottomNav
    >
      <div className="space-y-6 pb-20 font-gellix">
        {/* 3-Step Progress Stepper */}
        <div className="flex items-center justify-between gap-2 px-1">
          {[
            { num: 1 as const, label: 'Type' },
            { num: 2 as const, label: 'Room' },
            { num: 3 as const, label: 'Connect' },
          ].map((s, idx) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setStep(s.num)}
                  className="flex items-center gap-2 shrink-0"
                >
                  <span
                    className={`w-7 h-7 rounded-full text-text-xs font-semibold flex items-center justify-center border transition-colors ${
                      active
                        ? 'bg-amplitude-blue text-white border-amplitude-blue'
                        : done
                          ? 'bg-accent/15 text-accent-text border-accent-text'
                          : 'bg-surface-container text-on-surface-variant border-outline'
                    }`}
                  >
                    {done ? (
                      <span className="material-symbols-outlined text-[15px]">check</span>
                    ) : (
                      s.num
                    )}
                  </span>
                  <span
                    className={`text-text-xs font-semibold ${
                      active || done ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full ${
                      step > s.num ? 'bg-amplitude-blue' : 'bg-outline'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Device Type & Identity */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-title-xs font-semibold text-on-surface">Select device type</h2>
              <p className="text-text-xs text-on-surface-variant mt-0.5">
                Choose the hardware profile to emulate on your local bridge.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {DEVICE_TYPES.map((item) => {
                const selected = selectedType.type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleSelectType(item)}
                    className={`relative rounded-xl p-4 text-left border transition-colors bg-surface-container ${
                      selected
                        ? 'border-accent-text ring-1 ring-accent-text'
                        : 'border-outline hover:border-accent-text/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-accent-text mb-3">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div className="text-text-s font-semibold text-on-surface">{item.label}</div>
                    <div className="text-text-xs text-on-surface-variant capitalize mt-0.5">
                      {item.category}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-surface-container border border-outline p-4 space-y-3">
              <div>
                <label className="block text-text-xs font-medium text-on-surface-variant mb-1.5">
                  Device display name
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface focus:outline-none focus:border-accent-text"
                />
              </div>
              <div>
                <label className="block text-text-xs font-medium text-on-surface-variant mb-1.5">
                  Communication protocol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROTOCOLS.map((p) => (
                    <Button
                      key={p}
                      variant={protocol === p ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => setProtocol(p)}
                      className="h-8"
                    >
                      {p.replace('Simulated ', '')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Device Location */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-title-xs font-semibold text-on-surface">
                Select device location
              </h2>
              <p className="text-text-xs text-on-surface-variant mt-0.5">
                Assign <span className="text-on-surface font-semibold">{deviceName}</span> to a room
                for context-aware automations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {state.rooms.map((room) => {
                const selected = selectedRoomName === room.name;
                const roomDeviceCount = state.devices.filter(
                  (d) => d.roomName === room.name
                ).length;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomName(room.name)}
                    className={`relative rounded-xl p-4 text-left transition-colors bg-surface-container border ${
                      selected
                        ? 'border-accent-text ring-2 ring-accent-text'
                        : 'border-outline hover:border-accent-text/60'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amplitude-blue text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        selected
                          ? 'bg-accent/15 text-accent-text'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{room.icon}</span>
                    </div>
                    <div className="text-text-s font-semibold text-on-surface truncate">
                      {room.name}
                    </div>
                    <div className="text-text-xs text-on-surface-variant mt-0.5 tabular-nums">
                      {roomDeviceCount} device{roomDeviceCount === 1 ? '' : 's'} · {room.zone}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setRoomModalOpen(true)}
                className="dashed-room-card rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[124px] hover:border-accent-text hover:bg-surface-container-high transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-accent-text">
                  <span className="material-symbols-outlined text-[22px]">add</span>
                </div>
                <span className="text-text-xs font-semibold text-on-surface">Add new room</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Connect & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-title-xs font-semibold text-on-surface">Ready to connect</h2>
              <p className="text-text-xs text-on-surface-variant mt-0.5">
                Review configuration before provisioning on your simulated local bridge.
              </p>
            </div>

            <div className="rounded-xl bg-surface-container border border-outline p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-outline text-accent-text flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">{selectedType.icon}</span>
                </div>
                <div>
                  <div className="text-text-m font-semibold text-on-surface">{deviceName}</div>
                  <div className="text-text-xs text-on-surface-variant">
                    {selectedType.label} · {selectedRoomName}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-outline text-text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-on-surface-variant">Room assignment</span>
                  <span className="font-semibold text-on-surface">{selectedRoomName}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-on-surface-variant">Category</span>
                  <span className="font-semibold text-on-surface capitalize">
                    {selectedType.category}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-on-surface-variant">Bridge mode</span>
                  <span className="font-semibold text-accent-text">{protocol}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sticky Step Controls */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 backdrop-blur-md border-t border-outline p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="h-10 px-5"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                variant="primary"
                fullWidth
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                className="h-10 font-semibold"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                isLoading={pairing}
                onClick={handleConnect}
                className="h-10 font-semibold"
              >
                <span>{pairing ? 'Pairing node...' : 'Pair & add device'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Add New Room Modal */}
      {roomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setRoomModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl font-gellix"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-text-m font-semibold text-on-surface mb-1">Add new room</h3>
            <p className="text-text-xs text-on-surface-variant mb-4">
              Create a new zone to organize devices and automations.
            </p>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g., Guest Suite, Balcony, Studio"
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface focus:outline-none focus:border-accent-text"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setRoomModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};
