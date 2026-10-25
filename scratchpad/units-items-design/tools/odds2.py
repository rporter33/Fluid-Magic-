import importlib.util, sys
spec = importlib.util.spec_from_file_location('odds', sys.argv[1]); m = importlib.util.module_from_spec(spec)
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(m)
# Briar Guard att 11, str 12, Halberd 7 -> base 19
for name, de, prot, hp in [('Ash Militia', 8, 1, 10), ('Cinder Warrior', 9, 3, 11), ('Salamander (def 10 baseline, prot 8, hp 35)', 10, 8, 35)]:
    h = m.p_hit_melee(11, de); d = m.dmg_dist(19, prot); k = m.p_kill(d, hp)
    print(f'BG vs {name}: hit {h:.3f} avg {m.ev(d):.2f} kill|hit {k:.3f} kill/swing {h*k:.4f} 1-in {1/(h*k) if h*k>0 else float("inf"):.1f}')
h = m.p_hit_melee(10, 10); d = m.dmg_dist(11, 4); k = m.p_kill(d, 12)
print(f'Fire Sprite vs BG: hit {h:.3f} avg {m.ev(d):.2f} kill|hit {k:.3f} per swing {h*k:.4f} 1-in {1/(h*k):.1f}')
