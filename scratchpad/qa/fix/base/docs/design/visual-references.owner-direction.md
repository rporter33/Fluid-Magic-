# Owner direction, 2026-10-22 (binding; quote verbatim in docs)

After the painted map v3 mockup (https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV), the owner sent eight
screenshots of another fantasy strategy game in development and wrote:

> If there are any additional issues or qa needed. Please go ahead. With those as well.
>
> How is the battle scenes going ?
>
> Attached our photos from a game that I very much like the direction it's going the map you can see zoomed in
> and zoomed out. It's not cluttered it's clean and then also there's scenes from the endgame battle scenes. I
> would like the game to look this way.

The screenshots are references for direction only. They are not assets: never copy their art, models, layouts,
names, symbols or UI, never trace them, and never name the game in a prompt or a file the owner reviews. They are
kept outside the repo.

## What the screenshots show

**The map, zoomed in.** Natural, muted terrain painted continuously across province borders: dense dark forest
masses, shaded relief on hills and mountains, rivers, lakes and a bridge. Provinces are drawn only by thin lines in
the owner's color, a light translucent tint over owned land and a stronger tint on the selected or hovered
province. Armies and settlements are miniature figures on round colored bases; a town is a small walled circle on
a base. Very few labels and no badges or chips on the land. One small panel at a time.

**The map, zoomed out.** The land reads as a sculpted terrain model: its outer edge drops as rock cliffs into a
dark void, mountains stand up in relief, and the owner's tint and thin borders still show which land is whose.

**Battles.** A three-quarter overhead (isometric-style) view of a terrain field: sand, snow, a river with stone
bridges, a fort wall and gate. Each side is massed blocks of many small soldiers in formation, one figure per
soldier, with cavalry, archers whose arrows fly in visible volleys, and huge monsters (a dragon, a giant) many
times a soldier's size. Blood marks the ground where lines meet. A bar of unit cards with portraits and status
icons runs along the bottom; play, fast-forward and pause sit top right; hovering a unit shows its name, hitpoint
bar and morale bar.

## Read as

1. **QA:** look for and fix remaining issues across the game, not only the ones already listed.
2. **The map:** clean and uncluttered first. Natural painted relief terrain, continuous across borders; ownership
   by thin border lines and a light tint; armies and towns as miniatures on bases; labels and markers kept to what
   the zoom level needs. Zoomed out, a terrain model with cliff edges. This supersedes the parchment and ink look of
   `painted-map.owner-direction.md` for the land itself. The war table, the tavern, the layered UI, the wilds,
   settlements, alignment looks and portraits stay (owner-approved). Default: the terrain model sits on the oak war
   table like a sculpted sand table.
3. **Battles:** the overhead three-quarter view with massed formations, one figure per soldier where the count
   allows, big monsters at their true size, visible volleys, terrain features in the scene, the unit card bar, and
   hover cards with hitpoints and morale. This replaces the side view in `docs/12` S2.4 and S4 before those stages
   are built; the per-blow truth of S1 and the timeline, pacing, sound and HUD rules stay unless the new view needs
   them changed.
