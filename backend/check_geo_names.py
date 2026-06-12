import json
from pathlib import Path

path = Path(r'c:\GoGoProject\schools-map\frontend\src\data\borders.geojson')
text = path.read_text(encoding='utf-8')
geo = json.loads(text)

names = [f['properties']['name'] for f in geo['features'] if 'properties' in f and 'name' in f['properties']]
for name in sorted(names):
    print(repr(name))
print('count', len(names))
