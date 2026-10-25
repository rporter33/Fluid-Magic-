
### `docs/03-nations.md` (lands in 6b.1; the summon notes in 6b.3)

**In the second paragraph, replace "starting pretender chassis options" with:**

```markdown
the two pretender chassis that fit it (the realm rule of `docs/05-pretender.md` decides which
chassis it may take)
```

**Cinder Horde: add after "Identity levers: ...":**

```markdown
Pretender chassis (`docs/05-pretender.md`): the six generic chassis (Oracle of the Flux,
Titan, Great Wyrm, Living Monolith, Ascended Hero, Primordial) and the Red realm: Ash
Colossus, Ash Phoenix, Pyre Lord, Cinder Idol, Ember Hierophant. Fits: Titan and Ash
Colossus. Fire Sprites also join the Pyre Lord at battle start and the Cinder Idol each month.
```

**Thornwood: add after "Identity levers: ...":**

```markdown
Pretender chassis (`docs/05-pretender.md`): the six generic chassis and the Green realm: Wild
Spirit, World Tree, Horned Hunter, Elder Wyrm, Mother of Beasts. Fits: Wild Spirit and Living
Monolith. Wolves also join the Horned Hunter at battle start and the Mother of Beasts each
month.
```

**Sketches for M2: add at the end of the list:**

```markdown
Each M2 nation brings its color's pretender realm (six chassis, sketched in the 2026-10-21
pretender design) and its full blessing menu.
```

**Implementation decisions: replace the "Chassis that fit" item with:**

```markdown
- **Chassis** (Phase 6, revised in Phase 6b at the owner's direction for "good options for
  pretenders like Dominions has"): a nation may take the generic chassis and those of its own
  colors' realms, eleven for each M1 nation (`availableChassis`, `docs/05`). `NationDef.chassis`
  names the two the pretender screen marks as fitting: Cinder Horde, Titan and Ash Colossus;
  Thornwood, Wild Spirit and Living Monolith.
```

### `docs/02-magic.md` (section 8 in 6b.1; the decisions with the commits named)

**Replace section 8 with:**

```markdown
## 8. Blessings

Sacred units, the prophet, and a pretender with Avatar fight **blessed**. What they get is
chosen at pretender design from a blessing menu (`docs/05-pretender.md`, Step 6), after
Dominions 6. The menu was introduced on 2026-10-21 at the owner's direction ("good options for
pretenders like Dominions has").

- Bless points per color = pips in that color − 1; a color's points buy only its blessings.
- A blessing costs its requirement − 1 (at least 1); requirements run from 2 to 6.
- At most one blessing per group. Incarnate blessings work only while the god is on the map.
- Without a choice, each color at 4 or 5 pips gives its standard blessing and at 6 its greater
  one:

| Color | Standard (4 pips) | Greater (6 pips) |
|-------|-------------------|------------------|
| W | +2 morale, +1 protection | +4 morale, +2 protection |
| U | +2 defense, +2 precision | +4 defense, +4 precision |
| B | Life drain 2 per hit, +1 attack | Life drain 4 per hit, +2 attack |
| R | +2 attack, +2 strength | +4 attack, +4 strength |
| G | Regeneration 10% max HP per round, +1 protection | Regeneration 20%, +2 protection |

Blessings apply only in battle.
```

**Implementation decisions, add under "Battle spells":**

```markdown
- **Pretender abilities** (Phase 6b) are effect lists of the section 5 battle primitives on a
  pretender body, fired at battle start (`docs/04-battle.md`). They plan targets as a spell
  does, cost no fatigue or mana, and ignore spell power. Their ids never equal a spell id.
- **Spell power** (Phase 6b): a caster's `spellPower` adds to the amount of every damage and
  heal effect it casts (the Ember Hierophant: 3).
- **Blessing folds** (Phase 6b): every blessing is a stat change folded in at battle setup;
  weapon blessings copy each melee weapon with more damage, an element and armor piercing; a
  berserk blessing adds the tag; shield blessings add a retaliation shield of their element.
```

**Implementation decisions, add under "Rituals" (lands in Phase 8):**

```markdown
- **Effect tags on messages** (Phase 8, for the map's spell effects): a message about a
  ritual, a pretender's arrival or reform, an anointing or a monthly summon carries
  `fx: { kind, spell? }`. When a ritual completes on a province another nation owns and has
  `remoteDamage`, a negative `provincePop`, a positive `provinceUnrest` or a negative
  `provinceSupply`, that owner gets a `ritual` message ("Ash Rain struck Ember Ford."). No
  outcome changes; the determinism fixtures were regenerated in that commit.
```

### `docs/04-battle.md` (lands in 6b.2)

**Replay log: add to the list of event kinds:**

```markdown
`ability(unitId, abilityId, targets)`,
```

**Implementation decisions: in "A commander's rout", replace its first sentence with:**

```markdown
- **A commander's rout** (deviation from "checks morale too"): when a commander's last
  standing squad routs, the commander routs with it without a roll, unless it has morale 50 or
  is berserk, or the squad that broke is bound (below).
```

**Implementation decisions: add a new block at the end:**

```markdown
**Pretender abilities and new battle rules (Phase 6b)**

Added on 2026-10-21 at the owner's direction ("good options for pretenders like Dominions
has"). Each rule is tested alone; none adds a randomness source.

- **Battle-start abilities**: a commander's body may list abilities, each an effect list of
  `docs/02` section 5 primitives. In round 1, inside step 1 and before the scripts, commanders
  in caster order fire theirs, in list order, if they are active. An ability fires only when
  every effect has a target, as a spell needs; it plans targets as a spell does and lands its
  effects at once, with no fatigue, mana, research or spell power. It logs `ability` with its
  targets, then its effects' events. Only commanders carry abilities.
- **Multi-strike weapons**: a melee weapon with `strikes` n swings n times per troop per melee
  phase, each swing a full attack with its own target draw. A weapon with `maxTargetSize`
  strikes only targets of that size or smaller; with none present it swings at nothing and
  draws nothing.
- **Spell power**: see `docs/02-magic.md` decisions.
- **Retaliation shields**: a unit's shields are a list of element and amount (the Ash
  Colossus: fire 5). After the melee hits of a phase land, each damaging hit on a shielded
  unit costs its striker the shield's amount, per element, ignoring protection. Shields of one
  element add; each element logs its own `damage`, fire before nature.
- **Bound squads**: a squad summoned in the battle, or a squad of the unit its leading
  pretender's chassis summons each month, is bound. A bound squad that breaks never drags its
  commander into a rout; standing bound squads still keep it on the field. The one change for
  earlier content: summoned hornets pushed below morale 50 by Dread or Fear no longer drag
  their caster when they break.
- **Fear and morale 50**: Fear is a battle-long morale debuff; like Dread and unpaid upkeep, it
  can bring a morale-50 unit below the line, and such a unit then rolls like any other.
```

### `docs/08-ai.md` (lands in 6b.3 and Phase 8)

**Replace step 10 with:**

```markdown
10. **Pretender** (by `ChassisDef.role`): leaders, fighters, monsters and summoners join the
    main army after month 3; raiders join the army or take weak provinces alone; mages
    research if they can (the Oracle) or join the army; idols cast rituals in the capital.
```

**After the `armyPower` line of step 4, add:**

```markdown
    A pretender adds its chassis's `aiPower` (its Light Infantry equivalent, `docs/05`), and
    battle-start summons count as troops.
```
