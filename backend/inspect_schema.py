import psycopg
conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [row[0] for row in cur.fetchall()]
print('Tables:', tables)
for table in tables:
    print(f'\n{table}:')
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position")
    for col_name, col_type in cur.fetchall():
        print(f'  {col_name}: {col_type}')
cur.close()
conn.close()
