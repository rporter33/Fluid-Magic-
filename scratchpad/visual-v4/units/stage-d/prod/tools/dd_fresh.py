# Lists figure views whose every job has a post.json newer than prod/logs/post-since.txt (the current post code).
import json, os, collections
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
T = float(open(os.path.join(PROD, 'logs', 'post-since.txt')).read())
jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
st = collections.defaultdict(lambda: [0, 0])
for j in jobs:
    p = os.path.join(PROD, 'cut', os.path.basename(j['out']).rsplit('.png', 1)[0], 'post.json')
    k = f"{j['figure']}:{j['view']}"
    st[k][1] += 1
    if os.path.exists(p) and os.path.getmtime(p) >= T:
        st[k][0] += 1
done = [k for k, (a, b) in st.items() if a == b]
print('complete', len(done), 'of', len(st), 'jobs', sum(a for a, b in st.values()), 'of', len(jobs))
print(' '.join(done))
print('partial', {k: v for k, v in st.items() if 0 < v[0] < v[1]})
