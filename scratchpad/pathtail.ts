describe('move validation', () => {
  it('refuses broken paths, separated groups, and commanders that cannot move', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const far = Object.keys(state.map.provinces).find(
      (p) => p !== capital && !neighbors(state, capital).includes(p as ProvinceId),
    ) as ProvinceId;
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    const elsewhere = addArmy(state, red, a, 'cinderWarrior', 1);
    const tries: [CommanderId[], ProvinceId[]][] = [
      [[], [a]],
      [[army.id], []],
      [[army.id], [far]],
      [[army.id], [a, a]],
      [[army.id], ['p9999' as ProvinceId]],
      [[army.id, army.id], [a]],
      [[army.id, elsewhere.id], [a]],
      [[garrison.id], [a]],
    ];
    for (const [commanders, path] of tries) {
      const before = JSON.stringify(state);
      expect(applyCommand(state, { type: 'move', nation: red, commanders, path }).ok).toBe(false);
      expect(JSON.stringify(state)).toBe(before);
    }
  });
});

describe('findPath', () => {
  /** Bellman-Ford over the same leg costs, independent of the Dijkstra under test. */
  function shortest(state: GameState, from: ProvinceId, speed: number): Map<ProvinceId, number> {
    const dist = new Map<ProvinceId, number>([[from, 0]]);
    for (let round = 0; round < Object.keys(state.map.provinces).length; round++) {
      for (const mp of Object.values(state.map.provinces)) {
        const d = dist.get(mp.id);
        if (d === undefined) continue;
        for (const n of mp.neighbors) {
          const via = d + legDays(state, n, speed);
          if (via < (dist.get(n) ?? Infinity)) dist.set(n, via);
        }
      }
    }
    return dist;
  }

  /** Red owns every province and nobody else has armies, so no province is hostile. */
  function openMap(seed: number) {
    const s = setup(seed);
    for (const p of Object.values(s.state.provinces)) p.owner = s.red;
    for (const c of Object.values(s.state.commanders))
      if (c.owner !== s.red) c.location = s.capital;
    for (const c of Object.values(s.state.commanders)) if (c.owner !== s.red) c.owner = s.red;
    return s;
  }

  it('finds a connected path of least days to every province', () => {
    const { state, red, capital } = openMap(4);
    for (const speed of [1, 2, 3]) {
      const best = shortest(state, capital, speed);
      for (const target of Object.keys(state.map.provinces) as ProvinceId[]) {
        const path = findPath(state, red, capital, target, speed);
        if (target === capital) {
          expect(path).toBeNull();
          continue;
        }
        expect(path).not.toBeNull();
        let at = capital;
        for (const p of path!) {
          expect(neighbors(state, at)).toContain(p);
          at = p;
        }
        expect(at).toBe(target);
        expect(pathDays(state, path!, speed)).toBe(best.get(target));
      }
    }
  });

  it('goes through hostile provinces only at the end', () => {
    const { state, red, capital } = setup(4);
    const hostile = (p: ProvinceId) => state.provinces[p]!.owner !== red;
    for (const target of Object.keys(state.map.provinces) as ProvinceId[]) {
      const path = findPath(state, red, capital, target, 2);
      if (!path) continue;
      expect(path.slice(0, -1).some(hostile)).toBe(false);
    }
    // Every neighbor of the capital is independent at the start, so nothing beyond is reachable.
    const beyond = Object.keys(state.map.provinces).find(
      (p) => p !== capital && !neighbors(state, capital).includes(p as ProvinceId),
    ) as ProvinceId;
    expect(findPath(state, red, capital, beyond, 2)).toBeNull();
    expect(findPath(state, red, capital, neighbors(state, capital)[0]!, 2)).toEqual([
      neighbors(state, capital)[0],
    ]);
  });

  it('is deterministic', () => {
    const a = openMap(5);
    const b = openMap(5);
    const targets = Object.keys(a.state.map.provinces) as ProvinceId[];
    for (const t of targets) {
      expect(findPath(a.state, a.red, a.capital, t, 2)).toEqual(
        findPath(b.state, b.red, b.capital, t, 2),
      );
    }
  });
});
