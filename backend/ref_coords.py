import psycopg

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
for district_id in [12, 22, 13, 27]:
    print('\nDistrict', district_id)
    cur.execute(
        'SELECT id, name, latitude, longitude, coords FROM schools WHERE district_id = %s ORDER BY id LIMIT 10',
        (district_id,)
    )
    for row in cur.fetchall():
        print(row)
cur.close()
conn.close()
