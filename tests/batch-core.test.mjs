import test from "node:test";
import assert from "node:assert/strict";

import { runResilientBatches } from "../scripts/core/batch-core.js";

test("resilient batches isolate one failing item without discarding successful updates", async () => {
  const calls = [];
  const result = await runResilientBatches([1, 2, 3, 4, 5], 5, async (batch) => {
    calls.push([...batch]);
    if (batch.includes(3)) throw new Error("bad item");
  });

  assert.deepEqual([...result.succeeded].sort((a, b) => a - b), [1, 2, 4, 5]);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].item, 3);
  assert.ok(calls.some((batch) => batch.length > 1));
});
