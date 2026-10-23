// Graph helpers over index adjacency lists (province i's neighbors are adjacency[i]). Nodes in
// a `blocked` set are left out of the graph, as wild cells are while they are placed.

type Adjacency = readonly (readonly number[])[];

const NONE: ReadonlySet<number> = new Set();

/** Hop distance from the nearest source to every node; Infinity when unreachable. */
export function bfsDistances(
  adjacency: Adjacency,
  sources: readonly number[],
  blocked: ReadonlySet<number> = NONE,
): number[] {
  const dist = new Array<number>(adjacency.length).fill(Number.POSITIVE_INFINITY);
  const queue: number[] = [];
  for (const s of sources) {
    if (dist[s] !== 0 && !blocked.has(s)) {
      dist[s] = 0;
      queue.push(s);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head] as number;
    const next = (dist[node] ?? 0) + 1;
    for (const neighbor of adjacency[node] ?? []) {
      if ((dist[neighbor] ?? 0) > next && !blocked.has(neighbor)) {
        dist[neighbor] = next;
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

/** True when every node is reachable from node 0 (an empty graph counts as connected). */
export function isConnected(adjacency: Adjacency): boolean {
  if (adjacency.length === 0) return true;
  return bfsDistances(adjacency, [0]).every(Number.isFinite);
}

/** True when the nodes outside `blocked` are all reachable from each other. */
export function connectedWithout(adjacency: Adjacency, blocked: ReadonlySet<number>): boolean {
  let start = -1;
  for (let i = 0; i < adjacency.length && start < 0; i++) if (!blocked.has(i)) start = i;
  if (start < 0) return true;
  const dist = bfsDistances(adjacency, [start], blocked);
  return dist.every((d, i) => Number.isFinite(d) || blocked.has(i));
}

/**
 * Cut vertices (articulation points) of the graph without `blocked`: the nodes whose removal
 * splits the nodes of their component apart. Tarjan's low-link search, iterative, linear in
 * nodes and edges. Sorted by index.
 */
export function cutVertices(adjacency: Adjacency, blocked: ReadonlySet<number> = NONE): number[] {
  const n = adjacency.length;
  const order = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(0);
  const cut = new Array<boolean>(n).fill(false);
  let counter = 0;
  for (let root = 0; root < n; root++) {
    if (blocked.has(root) || order[root] !== -1) continue;
    order[root] = counter;
    low[root] = counter;
    counter++;
    let rootChildren = 0;
    // Each frame: the node, its parent in the search tree, and the next neighbor to look at.
    const stack: [number, number, number][] = [[root, -1, 0]];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1] as [number, number, number];
      const [node, parent, k] = frame;
      const list = adjacency[node] ?? [];
      if (k < list.length) {
        frame[2] = k + 1;
        const next = list[k] as number;
        if (next === parent || blocked.has(next)) continue;
        if (order[next] === -1) {
          order[next] = counter;
          low[next] = counter;
          counter++;
          if (node === root) rootChildren++;
          stack.push([next, node, 0]);
        } else {
          low[node] = Math.min(low[node] ?? 0, order[next] ?? 0);
        }
        continue;
      }
      stack.pop();
      if (parent < 0) continue;
      low[parent] = Math.min(low[parent] ?? 0, low[node] ?? 0);
      if (parent !== root && (low[node] ?? 0) >= (order[parent] ?? 0)) cut[parent] = true;
    }
    if (rootChildren >= 2) cut[root] = true;
  }
  return cut.flatMap((isCut, i) => (isCut ? [i] : []));
}

/**
 * The largest hop distance between two of `nodes` in the graph without `blocked`: one search
 * from each node. Infinity when two of them cannot reach each other; 0 for fewer than two.
 */
export function maxPairDistance(
  adjacency: Adjacency,
  nodes: readonly number[],
  blocked: ReadonlySet<number> = NONE,
): number {
  let worst = 0;
  for (const a of nodes) {
    const dist = bfsDistances(adjacency, [a], blocked);
    for (const b of nodes) worst = Math.max(worst, dist[b] ?? Number.POSITIVE_INFINITY);
  }
  return worst;
}
