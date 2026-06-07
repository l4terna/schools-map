import json, re
from pathlib import Path

geo_path = Path(r'c:\GoGoProject\schools-map\frontend\src\data\borders.geojson')
text = geo_path.read_text(encoding='utf-8')
geo = json.loads(text)
border_names = [f['properties']['name'] for f in geo['features'] if 'properties' in f and 'name' in f['properties']]

# parse DISTRICT_GEO keys and borderKeyword from TypeScript
src = Path(r'c:\GoGoProject\schools-map\frontend\src\data\districts.ts').read_text(encoding='utf-8')
pattern = re.compile(r'"([^"]+)": \{[^}]*?borderKeyword: "([^"]+)"', re.S)
geo_entries = pattern.findall(src)
print('parsed geo entries', len(geo_entries))
for k, b in geo_entries:
    print('key=', k, 'keyword=', b)

api_districts = [
    'Шалинский район', 'Грозненский район', 'Урус-Мартановский район', 'Аргун (город)',
    'Шалинский р-н', 'Грозный (город)', 'Урус-Мартановский р-н', 'Курчалоевский р-н',
    'Ножай-Юртовский р-н', 'Серноводский р-н', 'Шатойский р-н', 'Наурский р-н',
    'Итум-Калинский р-н', 'Гудермесский р-н', 'Шаройский р-н', 'Надтеречный р-н',
    'Шелковской р-н', 'Веденский р-н', 'Ачхой-Мартановский р-н',
]

for border in sorted(border_names):
    matched = False
    lower = border.lower()
    for dept_name, keyword in geo_entries:
        if keyword in lower:
            if dept_name in api_districts:
                matched = True
                print('OK', border, '->', dept_name)
                break
    if not matched:
        print('MISS', border)
