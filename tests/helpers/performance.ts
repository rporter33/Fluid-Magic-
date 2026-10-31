// Synchronous, CPU-bound work only. See docs/qa/timing.md for the measurement contract.
import process from 'node:process';
import { isMainThread } from 'node:worker_threads';
import { expect } from 'vitest';

export interface Timing {
  cpuMs: number;
  wallMs: number;
}

/** Includes this fork's user + kernel CPU (including V8 work), but not time descheduled. */
export function measure(work: () => void, operations = 1): Timing {
  if (!isMainThread) throw new Error('Performance tests require the forks pool');
  if (!Number.isInteger(operations) || operations < 1) {
    throw new Error('operations must be a positive integer');
  }
  const cpu = process.cpuUsage();
  const start = performance.now();
  work();
  const wallMs = performance.now() - start;
  const used = process.cpuUsage(cpu);
  return { cpuMs: (used.user + used.system) / 1000 / operations, wallMs: wallMs / operations };
}

export function median(values: readonly number[]): number {
  if (values.length === 0 || values.some((n) => !Number.isFinite(n) || n < 0)) {
    throw new Error('Expected nonempty, finite, nonnegative timing samples');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** No retries or discarded samples. Wall-clock acceptance is also enforced by test:perf. */
export function expectPerformance(
  label: string,
  samples: readonly Timing[],
  budgetMs: number,
  headroom: { headroomMs?: number; cpuOnlyHeadroomMs?: number } = {},
): void {
  const cpuMedianMs = median(samples.map((s) => s.cpuMs));
  const wallMedianMs = median(samples.map((s) => s.wallMs));
  const headroomMs = headroom.headroomMs ?? 0;
  const cpuOnlyHeadroomMs = headroom.cpuOnlyHeadroomMs ?? 0;
  const limitMs = budgetMs + headroomMs;
  const report = {
    label,
    budgetMs,
    headroomMs,
    cpuOnlyHeadroomMs,
    cpuMedianMs,
    wallMedianMs,
    samples,
  };
  console.log(`[performance] ${JSON.stringify(report)}`);
  const message = JSON.stringify(report);
  expect(cpuMedianMs, message).toBeLessThan(limitMs + cpuOnlyHeadroomMs);
  if (process.env.FLUID_PERF_WALL === '1') {
    expect(wallMedianMs, message).toBeLessThan(limitMs);
  }
}
