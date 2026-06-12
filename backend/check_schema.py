import psycopg
conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='schools' ORDER BY ordinal_position")
for name, dtype in cur.fetchall():
    print(name, dtype)
cur.close()
conn.close()

