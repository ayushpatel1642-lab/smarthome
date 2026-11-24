import type { SmartDevice } from '../../types/home';

export type TransportKind = 'simulation' | 'mqtt' | 'rest';

export interface DeviceCommand {
  deviceId: number;
  command:
    | 'toggle_power'
    | 'set_brightness'
    | 'set_temperature'
    | 'set_ac_mode'
    | 'set_fan_speed'
    | 'toggle_lock'
    | 'reconnect';
  value?: string | number | boolean;
}

export interface DeviceTelemetryEvent {
  deviceId: number;
  timestamp: string;
  transport: TransportKind;
  simulated: boolean;
  latencyMs: number;
  payload: Record<string, string | number | boolean | null>;
}

export interface DeviceCommunicationAdapter {
  readonly transport: TransportKind;
  readonly isSimulated: boolean;
  readonly label: string;
  sendCommand(device: SmartDevice, cmd: DeviceCommand): Promise<DeviceTelemetryEvent>;
  ping(device: SmartDevice): Promise<{ online: boolean; latencyMs: number; simulated: boolean }>;
  subscribe(listener: (event: DeviceTelemetryEvent) => void): () => void;
}

/**
 * Modular Simulation Adapter for demonstrating Aware Home OS without physical hardware.
 * Clearly marks all events as simulated=true so hardware telemetry is never misrepresented.
 * Future hardware integrations can implement DeviceCommunicationAdapter for MQTT or REST bridges.
 */
export class SimulationDeviceAdapter implements DeviceCommunicationAdapter {
  readonly transport: TransportKind = 'simulation';
  readonly isSimulated = true;
  readonly label = 'Simulated Local Bridge (No Hardware Paired)';
  private listeners = new Set<(event: DeviceTelemetryEvent) => void>();

  async sendCommand(device: SmartDevice, cmd: DeviceCommand): Promise<DeviceTelemetryEvent> {
    const latencyMs = Math.floor(24 + Math.random() * 28);
    const event: DeviceTelemetryEvent = {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      transport: this.transport,
      simulated: true,
      latencyMs,
      payload: {
        command: cmd.command,
        value: cmd.value ?? null,
        protocol: device.protocol,
      },
    };
    this.listeners.forEach((fn) => fn(event));
    return event;
  }

  async ping(_device: SmartDevice): Promise<{ online: boolean; latencyMs: number; simulated: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return {
      online: true,
      latencyMs: Math.floor(32 + Math.random() * 22),
      simulated: true,
    };
  }

  subscribe(listener: (event: DeviceTelemetryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const activeDeviceAdapter: DeviceCommunicationAdapter = new SimulationDeviceAdapter();
