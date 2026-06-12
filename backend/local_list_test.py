import re
import psycopg

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
cur.execute("SELECT id, name FROM districts")
rows = cur.fetchall()
cur.close(); conn.close()

print('rows count', len(rows))

def normalize(name: str) -> str:
    n = re.sub(r"\s+", " ", name.lower()).strip()
    n = n.replace("городской округ", "город")
    n = n.replace("район", "р-н")
    n = n.replace("(город)", "город")
    return n

def prefer(candidate: str, current: str) -> bool:
    if "(город)" in candidate and "(город)" not in current:
        return True
    if "р-н" in candidate and "р-н" not in current:
        return True
    return False

by_key = {}
for row in rows:
    district = {"id": row[0], "name": row[1]}
    key = normalize(district["name"])
    existing = by_key.get(key)
    if existing is None or prefer(district["name"], existing["name"]):
        by_key[key] = district

print('deduped count', len(by_key))
for k,v in by_key.items():
    print(k, '=>', v)
