# @dg-kit/transport-tauri-blec

## 1.1.0

### Minor Changes

- f9ab2db: Add `@dg-kit/transport-tauri-blec` — Tauri 2 BLE `DeviceClient` backed by `@mnlphlp/plugin-blec`. Mirrors `transport-webbluetooth` for non-browser runtimes (Tauri Android primary target). Synthesizes `BluetoothRemoteGATT*Like` shapes from plugin-blec's flat API so the Coyote protocol layer is unchanged.

### Patch Changes

- Updated dependencies [f9ab2db]
  - @dg-kit/core@1.1.0
  - @dg-kit/protocol@1.1.0
