// Temporary content patches for the content validation tests.

/** Sets obj[key] to value while `run` runs, then puts the old value back. */
export function patched<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
  run: () => void,
): void {
  const saved = obj[key];
  obj[key] = value;
  try {
    run();
  } finally {
    obj[key] = saved;
  }
}
