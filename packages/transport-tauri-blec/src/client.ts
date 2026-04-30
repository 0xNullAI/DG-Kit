import type {
  DeviceClient,
  DeviceCommand,
  DeviceCommandResult,
  DeviceState,
} from '@dg-kit/core';
import type { WebBluetoothProtocolAdapter } from '@dg-kit/protocol';
import { createGattShim } from './gatt-shim.js';
import { resolvePluginBlec, type BleDeviceInfo } from './plugin-blec.js';

export interface DiscoveredDevice {
  address: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  services: string[];
}

export interface TauriBlecDeviceClientOptions {
  protocol: WebBluetoothProtocolAdapter;
  /**
   * Invoked once after the scan completes (or immediately on each update — see
   * `liveUpdates`). The host UI shows the device list and resolves with the
   * chosen address, or `null` if the user cancels.
   */
  selectDevice: (devices: DiscoveredDevice[]) => Promise<string | null>;
  /**
   * Optional client-side filter applied to scan results before they reach
   * `selectDevice`. Coyote V2 names start with `D-LAB ESTIM01`; V3 with `47L121`.
   * Default: no filter (caller must filter or DevicePicker shows all).
   */
  namePrefixes?: string[];
  /** Scan window in milliseconds. Defaults to 8000. */
  scanDurationMs?: number;
}

export class TauriBlecDeviceClient implements DeviceClient {
  private readonly listeners = new Set<(state: DeviceState) => void>();
  private connected = false;
  private fireDisconnect: (() => void) | null = null;

  constructor(private readonly options: TauriBlecDeviceClientOptions) {
    this.options.protocol.subscribe((state) => {
      for (const l of this.listeners) l(state);
    });
  }

  async connect(): Promise<void> {
    const api = await resolvePluginBlec();

    const granted = await api.checkPermissions(true);
    if (!granted) {
      throw new Error('未授予蓝牙权限');
    }

    const seen = new Map<string, BleDeviceInfo>();
    const scanDuration = this.options.scanDurationMs ?? 8000;
    const prefixes = this.options.namePrefixes;

    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      api
        .startScan((devices) => {
          for (const d of devices) {
            if (prefixes && !prefixes.some((p) => d.name.startsWith(p))) continue;
            seen.set(d.address, d);
          }
        }, scanDuration)
        .then(() => {
          timer = setTimeout(() => resolve(), scanDuration + 200);
        })
        .catch(reject);
      // Safety: also resolve after scanDuration even if promise above hangs.
      setTimeout(() => {
        if (timer === null) resolve();
      }, scanDuration + 1000);
    });

    await api.stopScan().catch(() => undefined);

    const discovered: DiscoveredDevice[] = [...seen.values()].map((d) => ({
      address: d.address,
      name: d.name,
      rssi: d.rssi,
      isConnected: d.isConnected,
      services: d.services,
    }));

    const address = await this.options.selectDevice(discovered);
    if (!address) {
      throw new Error('用户取消了设备选择');
    }

    const chosen = seen.get(address);
    const deviceName = chosen?.name ?? '';

    let shim: ReturnType<typeof createGattShim> | null = null;
    await api.connect(address, () => {
      this.connected = false;
      shim?.fireDisconnect();
      void this.options.protocol.onDisconnected();
    });

    shim = createGattShim({
      address,
      name: deviceName,
      api,
      onDisconnect: () => undefined,
    });
    this.fireDisconnect = shim.fireDisconnect;

    try {
      await this.options.protocol.onConnected({
        device: shim.device,
        server: shim.server,
      });
      this.connected = true;
    } catch (error) {
      await api.disconnect().catch(() => undefined);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    const api = await resolvePluginBlec();
    await api.disconnect().catch(() => undefined);
    this.connected = false;
    this.fireDisconnect?.();
    this.fireDisconnect = null;
    await this.options.protocol.onDisconnected();
  }

  async execute(command: DeviceCommand): Promise<DeviceCommandResult> {
    return this.options.protocol.execute(command);
  }

  async emergencyStop(): Promise<void> {
    await this.options.protocol.emergencyStop();
  }

  async getState(): Promise<DeviceState> {
    return this.options.protocol.getState();
  }

  onStateChanged(listener: (state: DeviceState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
