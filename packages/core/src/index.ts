/**
 * @dg-kit/core — shared types and contract interfaces.
 *
 * Runtime-agnostic. Consumed by every other @dg-kit package and by the three
 * downstream apps (DG-Agent, DG-MCP, DG-Chat).
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type Channel = 'A' | 'B';

/** A single 25 ms wave step: `[encodedFrequency, intensity]`. */
export type WaveFrame = [number, number];

export interface WaveformDefinition {
  id: string;
  name: string;
  description?: string;
  /** Sequence of 25 ms steps. */
  frames: WaveFrame[];
}

// ---------------------------------------------------------------------------
// Device state
// ---------------------------------------------------------------------------

export interface DeviceState {
  connected: boolean;
  deviceName?: string;
  address?: string;
  battery?: number;
  strengthA: number;
  strengthB: number;
  limitA: number;
  limitB: number;
  waveActiveA: boolean;
  waveActiveB: boolean;
  currentWaveA?: string;
  currentWaveB?: string;
}

export function createEmptyDeviceState(): DeviceState {
  return {
    connected: false,
    battery: 0,
    strengthA: 0,
    strengthB: 0,
    limitA: 200,
    limitB: 200,
    waveActiveA: false,
    waveActiveB: false,
  };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export type DeviceCommand =
  | {
      type: 'start';
      channel: Channel;
      strength: number;
      waveform: WaveformDefinition;
      loop: boolean;
    }
  | { type: 'stop'; channel?: Channel }
  | { type: 'adjustStrength'; channel: Channel; delta: number }
  | { type: 'changeWave'; channel: Channel; waveform: WaveformDefinition; loop: boolean }
  | { type: 'burst'; channel: Channel; strength: number; durationMs: number }
  | { type: 'emergencyStop' };

export interface TimerCommand {
  type: 'timer';
  seconds: number;
  label: string;
}

export interface DeviceCommandResult {
  state: DeviceState;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// Tool plumbing
// ---------------------------------------------------------------------------

export interface ToolCall {
  id: string;
  name: string;
  displayName?: string;
  args: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  displayName?: string;
  description: string;
  /** JSON Schema for the tool parameters. */
  parameters: Record<string, unknown>;
}

export type ToolExecutionPlan =
  | { type: 'device'; command: DeviceCommand }
  | { type: 'timer'; command: TimerCommand }
  | { type: 'inline'; output: string; summary?: string };

export function isDeviceToolName(name: string): boolean {
  return (
    name === 'start' ||
    name === 'stop' ||
    name === 'adjust_strength' ||
    name === 'change_wave' ||
    name === 'burst'
  );
}

// ---------------------------------------------------------------------------
// Contract interfaces
// ---------------------------------------------------------------------------

export interface DeviceClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getState(): Promise<DeviceState>;
  execute(command: DeviceCommand): Promise<DeviceCommandResult>;
  emergencyStop(): Promise<void>;
  onStateChanged(listener: (state: DeviceState) => void): () => void;
}

export interface WaveformLibrary {
  getById(id: string): Promise<WaveformDefinition | null>;
  list(): Promise<WaveformDefinition[]>;
  /**
   * Persist a new or updated waveform. Optional because not every library
   * implementation supports writing (e.g. a read-only Node bundle); design
   * tools should branch on its presence.
   */
  save?(waveform: WaveformDefinition): Promise<void>;
}

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
