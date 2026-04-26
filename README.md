# DG-Kit

Shared TypeScript runtime for DG-Lab Coyote 2.0 / 3.0 control surfaces.

`@dg-kit/*` packages contain everything that's shared across DG-Agent, DG-MCP and DG-Chat: device protocol, waveform library, tool definitions, and a Web Bluetooth transport. Browser-only or Node-only adapters live in the consumer projects (DG-Agent / DG-MCP) — this repo stays runtime-agnostic where it can.

## Packages

| Package                                                               | Purpose                                                                                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [`@dg-kit/core`](./packages/core)                                     | Types, interfaces, command shapes                                                                                                       |
| [`@dg-kit/protocol`](./packages/protocol)                             | Coyote V2 / V3 BLE protocol adapters (transport-agnostic)                                                                               |
| [`@dg-kit/waveforms`](./packages/waveforms)                           | Built-in waveforms, design compiler, `.pulse` parser                                                                                    |
| [`@dg-kit/tools`](./packages/tools)                                   | LLM tool definitions (`start` / `stop` / `adjust_strength` / `change_wave` / `burst` / `design_wave`) with injectable rate-limit policy |
| [`@dg-kit/transport-webbluetooth`](./packages/transport-webbluetooth) | Browser-side `DeviceClient` over Web Bluetooth                                                                                          |

## Repo layout

```
packages/
  core/                      @dg-kit/core
  protocol/                  @dg-kit/protocol         depends on: core
  waveforms/                 @dg-kit/waveforms        depends on: core
  tools/                     @dg-kit/tools            depends on: core, waveforms
  transport-webbluetooth/    @dg-kit/transport-webbluetooth  depends on: core, protocol
```

## Development

```bash
npm install
npm run typecheck
npm run test
npm run build
```

## Releasing

`@dg-kit/*` packages share a single version (pinned via changesets `fixed`). To cut a release:

1. Make code changes on a feature branch.
2. `npx changeset` — write a release note.
3. PR to `main`. CI runs lint / typecheck / test / build.
4. After merge, the release workflow opens a "Version Packages" PR. Merging that PR publishes to npm.

## Consumers

- [DG-Agent](https://github.com/0xNullAI/DG-Agent) — browser AI controller
- [DG-MCP](https://github.com/0xNullAI/DG-MCP) — Model Context Protocol server (Node)
- [DG-Chat](https://github.com/0xNullAI/DG-Chat) — P2P multi-user room

## License

MIT
