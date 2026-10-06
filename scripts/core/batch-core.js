/**
 * Execute a batch operation with recursive split-on-failure isolation.
 *
 * Large Foundry document mutations are fast in batches, but a single bad
 * document can otherwise fail an entire bulk request. Failed chunks are split
 * until the specific failing item(s) are isolated while successful chunks stay
 * batched.
 */
export async function runResilientBatches(items, batchSize, operation) {
  if (!Array.isArray(items)) throw new TypeError("items must be an array.");
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new RangeError("batchSize must be a positive integer.");
  }
  if (typeof operation !== "function") throw new TypeError("operation must be a function.");

  const succeeded = [];
  const failed = [];

  async function runChunk(chunk) {
    if (chunk.length === 0) return;

    try {
      await operation(chunk);
      succeeded.push(...chunk);
      return;
    } catch (error) {
      if (chunk.length === 1) {
        failed.push({ item: chunk[0], error });
        return;
      }
    }

    const middle = Math.ceil(chunk.length / 2);
    await runChunk(chunk.slice(0, middle));
    await runChunk(chunk.slice(middle));
  }

  for (let index = 0; index < items.length; index += batchSize) {
    await runChunk(items.slice(index, index + batchSize));
  }

  return Object.freeze({
    total: items.length,
    succeeded: Object.freeze(succeeded),
    failed: Object.freeze(failed)
  });
}
