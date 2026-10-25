# The scale rule for an action frame (used by the boards and the packer), from the estimates dd_post.py stores:
#   area      the frame's painted area against the approved idle's, as the maquette's area changes between the two poses
#   thickness the body's thickness (95th percentile of the distance to the silhouette's edge) against the idle's
#   fit       the maquette registration's scale, with the idle's correction
# Where the maquette registered well at the area scale (fit IoU 0.75 or better) the area scale stands; otherwise the
# median of the three (one estimator fails at a time: the area where the painting's pose departed from its maquette, the
# thickness where a bent or turned trunk changes its apparent width, the fit where the silhouettes disagree). The art
# director's overrides (prod/selection.json "scale": {"<job>/<action>": factor}) multiply the result after the look.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))


def overrides():
    p = os.path.join(PROD, 'selection.json')
    return json.load(open(p)).get('scale', {}) if os.path.exists(p) else {}


def final_wpp(fr, job=None, ov=None):
    reg = fr['registration']
    a, t, f = reg.get('wuPerPxFromArea'), reg.get('wuPerPxFromThickness'), reg.get('wuPerPxFromFit')
    fa = reg.get('fitAtAreaScale') or reg.get('fitIoU')
    if a is None or t is None:
        w, rule = fr['wuPerPx'], 'stored'
    elif fa is not None and fa >= 0.75:
        w, rule = a, 'area'
    else:
        w, rule = sorted([a, t, f])[1], 'median'
    ov = overrides() if ov is None else ov
    k = ov.get(f'{job}/{fr["action"]}') if job else None
    if k:
        w *= k; rule += f' x{k} (art director)'
    return w, rule
