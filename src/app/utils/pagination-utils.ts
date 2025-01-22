export function loadBatch<T>(
  data: T[],
  currentBatch: T[],
  batchSize: number
): T[] {
  const nextBatch = data.slice(
    currentBatch.length,
    currentBatch.length + batchSize
  );
  return [...currentBatch, ...nextBatch];
}
