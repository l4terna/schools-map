import urllib.request, json, time, sys
base='http://127.0.0.1:8000'

def get(path):
    with urllib.request.urlopen(base+path, timeout=5) as r:
        return json.load(r)

for _ in range(20):
    try:
        districts = get('/api/districts')
        break
    except Exception as e:
        time.sleep(0.5)
else:
    print('FAILED to reach /api/districts', file=sys.stderr)
    sys.exit(2)

print('districts count:', len(districts))
if len(districts) > 0:
    print('sample district:', districts[0])
    did = districts[0].get('id')
    try:
        schools = get(f'/api/districts/{did}/schools')
        print('schools for id', did, 'count', len(schools))
        print('sample school:', schools[0] if schools else 'none')
    except Exception as e:
        print('FAILED to fetch schools for', did, 'error', e, file=sys.stderr)
