# @dg-kit/tools

LLM-facing tool definitions for DG-Lab Coyote control.

Six device tools (`start`, `stop`, `adjust_strength`, `change_wave`, `burst`, `design_wave`) plus a `timer` tool, all generating JSON Schema for direct injection into OpenAI / Anthropic / MCP tool-call APIs. Each tool validates its inputs (zod) and returns a `ToolExecutionPlan` — a `DeviceCommand` for the device tools, an inline string for `design_wave` after saving, or a `TimerCommand` for `timer`.

## Rate-limit policy

Tools that hint at "per-turn" caps (`adjust_strength`, `burst`, `design_wave`) accept an injectable `RateLimitPolicy`. Consumers pick the implementation that matches their runtime model:

- **DG-Agent** (turn-based): `createTurnRateLimitPolicy()` — counters reset on each new user turn.
- **DG-MCP** (stateless RPC): `createSlidingWindowRateLimitPolicy({ windowMs })` — keeps a timestamp ring and rejects calls that exceed the window cap.
- **No-op**: `createNoOpRateLimitPolicy()` — always allows; useful in tests.

```ts
import { createDefaultToolRegistry } from '@dg-kit/tools';

const registry = createDefaultToolRegistry({
  waveformLibrary,
  rateLimitPolicy: createSlidingWindowRateLimitPolicy({ windowMs: 5000 }),
});

const tools = await registry.listDefinitions(); // → ToolDefinition[]
const plan = await registry.resolve(toolCall); // → ToolExecutionPlan
```
