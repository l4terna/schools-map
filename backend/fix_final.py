import psycopg

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()

# Fix ИП Ахмадов Алихан - use Urus-Martanovsky district coords
cur.execute(
    "UPDATE schools SET latitude = %s, longitude = %s, coords = %s WHERE id = %s",
    (43.157099, 45.471223, '43.157099,45.471223', 575)
)
print('Updated ИП Ахмадов Алихан (id=575)')

# Fix СОШ с. Виноградное - use Groznensky district coords  
cur.execute(
    "UPDATE schools SET latitude = %s, longitude = %s, coords = %s WHERE id = %s",
    (43.379151, 45.828929, '43.379151,45.828929', 216)
)
print('Updated СОШ с. Виноградное (id=216)')

conn.commit()
cur.close()
conn.close()
