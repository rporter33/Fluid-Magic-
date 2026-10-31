import process from 'node:process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectPerformance, measure, median } from './performance';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('performance measurements', () => {
  it('takes the numeric median of all samples without changing their order', () => {
    const values = [100, 2, 10, 4];
    expect(median(values)).toBe(7);
    expect(values).toEqual([100, 2, 10, 4]);
    expect(median([100, 2, 10])).toBe(10);
  });

  it('rejects empty or invalid measurements instead of passing a missing benchmark', () => {
    for (const samples of [[], [NaN], [Infinity], [-1]]) {
      expect(() => median(samples)).toThrow();
    }
  });

  it('counts user and system CPU, converts microseconds, and normalizes a batch', () => {
    const cpu = vi
      .spyOn(process, 'cpuUsage')
      .mockReturnValueOnce({ user: 100, system: 20 })
      .mockReturnValueOnce({ user: 8000, system: 2000 });
    vi.spyOn(performance, 'now').mockReturnValueOnce(30).mockReturnValueOnce(1030);
    let calls = 0;
    expect(measure(() => calls++, 5)).toEqual({ cpuMs: 2, wallMs: 200 });
    expect(calls).toBe(1);
    expect(cpu).toHaveBeenLastCalledWith({ user: 100, system: 20 });
  });

  it('propagates a workload failure and rejects an invalid batch size', () => {
    expect(() =>
      measure(() => {
        throw new Error('broken workload');
      }),
    ).toThrow('broken workload');
    for (const count of [0, -1, 0.5, Infinity]) {
      expect(() => measure(() => undefined, count)).toThrow('positive integer');
    }
  });

  it('allows scheduler delay without increasing the CPU budget', () => {
    vi.stubEnv('FLUID_PERF_WALL', '0');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expectPerformance('descheduled', [{ cpuMs: 5, wallMs: 5000 }], 10);
    expect(() => {
      expectPerformance('too much work', [{ cpuMs: 11, wallMs: 5000 }], 10);
    }).toThrow();
  });

  it('does not hide a sustained regression behind one fast sample', () => {
    vi.stubEnv('FLUID_PERF_WALL', '0');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(() => {
      expectPerformance(
        'regression',
        [1, 11, 12].map((n) => ({ cpuMs: n, wallMs: n })),
        10,
      );
    }).toThrow();
  });

  it('also enforces the wall budget in quiet acceptance mode', () => {
    vi.stubEnv('FLUID_PERF_WALL', '1');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(() => {
      expectPerformance('wall regression', [{ cpuMs: 5, wallMs: 11 }], 10);
    }).toThrow();
    expectPerformance('within both budgets', [{ cpuMs: 5, wallMs: 9 }], 10);
  });

  it('uses only the explicitly supplied headroom and fails at the limit', () => {
    vi.stubEnv('FLUID_PERF_WALL', '1');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expectPerformance('existing slack', [{ cpuMs: 89, wallMs: 89 }], 45, { headroomMs: 45 });
    expect(() => {
      expectPerformance('over slack', [{ cpuMs: 90, wallMs: 90 }], 45, { headroomMs: 45 });
    }).toThrow();
  });
  it('does not apply parallel-CPU headroom to the elapsed-time requirement', () => {
    vi.stubEnv('FLUID_PERF_WALL', '1');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expectPerformance('parallel CPU', [{ cpuMs: 3, wallMs: 1.5 }], 2, { cpuOnlyHeadroomMs: 2 });
    expect(() => {
      expectPerformance('wall too slow', [{ cpuMs: 3, wallMs: 2.1 }], 2, { cpuOnlyHeadroomMs: 2 });
    }).toThrow();
    expect(() => {
      expectPerformance('CPU too slow', [{ cpuMs: 4, wallMs: 1.5 }], 2, { cpuOnlyHeadroomMs: 2 });
    }).toThrow();
  });
});
