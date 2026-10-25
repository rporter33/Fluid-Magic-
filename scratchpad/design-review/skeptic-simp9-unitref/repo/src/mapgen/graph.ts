// Graph helpers over index adjacency lists (province i's neighbors are adjacency[i]).

/** Hop distance from the nearest source to every node; Infinity when unreachable. */
export function bfsDistances(
  adjacency: readonly (readonly number[])[],
  sources: readonly number[],
): number[] {
  const dist = new Array<number>(adjacency.length).fill(Number.POSITIVE_INFINITY);
  const queue: number[] = [];
  for (const s of sources) {
    if (dist[s] !== 0) {
      dist[s] = 0;
      queue.push(s);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head] as number;
    const next = (dist[node] ?? 0) + 1;
    for (const neighbor of adjacency[node] ?? []) {
      if ((dist[neighbor] ?? 0) > next) {
        dist[neighbor] = next;
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

/** True when every node is reachable from node 0 (an empty graph counts as connected). */
export function isConnected(adjacency: readonly (readonly number[])[]): boolean {
  if (adjacency.length === 0) return true;
  return bfsDistances(adjacency, [0]).every(Number.isFinite);
}
