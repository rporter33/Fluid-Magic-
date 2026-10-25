import { redField, neighbors } from '/home/user/fm-p7f/tests/sim/fixtures';
import { independentCount } from '/home/user/fm-p7f/src/sim/independents';
const { state, capital } = redField();
for (const n of neighbors(state, capital)) {
  console.log(n, state.provinces[n]!.owner, independentCount(state, n), neighbors(state, n).join(','));
}
