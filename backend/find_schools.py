import psycopg

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
cur.execute("SELECT id,name,district_id,latitude,longitude,coords FROM schools WHERE name ILIKE %s OR name ILIKE %s", ('%Ахмадов Алихан%', '%Виноградное%'))
rows = cur.fetchall()
for row in rows:
    print(row)
cur.close()
conn.close()
