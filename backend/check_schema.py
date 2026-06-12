import urllib.request
import json

r = urllib.request.urlopen('http://127.0.0.1:8000/api/districts/21/schools')
data = json.load(r)
print(f'count: {len(data)}')
if data:
    s = data[0]
    print(f'School: {s["name"]}, coords: {s["coords"]}')

