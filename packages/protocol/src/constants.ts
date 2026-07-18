import type { DeviceKind } from '@dg-kit/core';
import type { RequestDeviceOptionsLike } from './types.js';

// V3 (Coyote 3.0)
export const V3_DEVICE_NAME_PREFIX = '47L121';
export const V3_SENSOR_NAME_PREFIX = '47L120';
export const V3_PRIMARY_SERVICE = '0000180c-0000-1000-8000-00805f9b34fb';
export const V3_WRITE_CHAR = '0000150a-0000-1000-8000-00805f9b34fb';
export const V3_NOTIFY_CHAR = '0000150b-0000-1000-8000-00805f9b34fb';
export const V3_BATTERY_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
export const V3_BATTERY_CHAR = '00001500-0000-1000-8000-00805f9b34fb';

// Other 47L12x-family devices (dungeonlab-open/dglab-bluetooth-protocol).
// They all share the exact same GATT skeleton as Coyote V3 — service 0x180C,
// write 0x150A, notify 0x150B, battery 0x180A/0x1500 — only the advertised
// name prefix and the application-layer opcodes differ, so no new UUID
// constants are needed, just new prefixes.
export const PAW_PRINTS_DEVICE_NAME_PREFIX = V3_SENSOR_NAME_PREFIX;
export const CIVET_DEVICE_NAME_PREFIX = '47L124';
export const OPOSSUM_DEVICE_NAME_PREFIX = '47L127';

// V2 (Coyote 2.0)
export const V2_DEVICE_NAME_PREFIX = 'D-LAB ESTIM';
export const v2Uuid = (short: string): string => `955a${short}-0fe2-f5aa-a094-84b8d4f3e8ad`;
export const V2_PRIMARY_SERVICE = v2Uuid('180b');
export const V2_STRENGTH_CHAR = v2Uuid('1504');
export const V2_WAVE_A_CHAR = v2Uuid('1505');
export const V2_WAVE_B_CHAR = v2Uuid('1506');
export const V2_BATTERY_SERVICE = v2Uuid('180a');
export const V2_BATTERY_CHAR = v2Uuid('1500');

export const COYOTE_REQUEST_DEVICE_OPTIONS: RequestDeviceOptionsLike = {
  filters: [
    { namePrefix: V3_DEVICE_NAME_PREFIX },
    { namePrefix: V3_SENSOR_NAME_PREFIX },
    { namePrefix: V2_DEVICE_NAME_PREFIX },
  ],
  optionalServices: [
    V3_PRIMARY_SERVICE,
    V3_BATTERY_SERVICE,
    V2_PRIMARY_SERVICE,
    V2_BATTERY_SERVICE,
  ],
};

/**
 * Scan filter covering every known 47L12x-family device plus the legacy V2
 * name. Superset of `COYOTE_REQUEST_DEVICE_OPTIONS` — prefer this one for
 * new scan UIs; the old export is kept for backward compatibility since
 * dropping it would be a breaking change for existing consumers.
 */
export const DG_LAB_REQUEST_DEVICE_OPTIONS: RequestDeviceOptionsLike = {
  filters: [
    { namePrefix: V3_DEVICE_NAME_PREFIX },
    { namePrefix: PAW_PRINTS_DEVICE_NAME_PREFIX },
    { namePrefix: CIVET_DEVICE_NAME_PREFIX },
    { namePrefix: OPOSSUM_DEVICE_NAME_PREFIX },
    { namePrefix: V2_DEVICE_NAME_PREFIX },
  ],
  optionalServices: [V3_PRIMARY_SERVICE, V3_BATTERY_SERVICE, V2_PRIMARY_SERVICE, V2_BATTERY_SERVICE],
};

/**
 * Identify which 47L12x-family device (or the legacy V2 unit) a scanned/
 * connected BLE device name belongs to. Single source of truth so consumers
 * (DG-MCP's `classifyName`, DG-Chat, DG-Agent) don't each re-implement
 * prefix matching and drift out of sync with each other.
 */
export function detectDeviceKind(name: string | undefined | null): DeviceKind | 'unknown' {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'unknown';
  if (trimmed.startsWith(V3_DEVICE_NAME_PREFIX)) return 'coyote';
  if (trimmed.startsWith(V2_DEVICE_NAME_PREFIX)) return 'coyote';
  if (trimmed.startsWith(PAW_PRINTS_DEVICE_NAME_PREFIX)) return 'paw-prints';
  if (trimmed.startsWith(CIVET_DEVICE_NAME_PREFIX)) return 'civet-edging';
  if (trimmed.startsWith(OPOSSUM_DEVICE_NAME_PREFIX)) return 'opossum';
  return 'unknown';
}
