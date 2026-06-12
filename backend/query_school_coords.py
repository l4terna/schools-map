import psycopg
from pprint import pprint

patterns = [
    "%Первомайская СОШ%",
    "%СОШ с.Садовое%",
    "%СОШ №2 ст. Первомайская%",
    "%СОШ с. Пролетарское%",
    "%Арбильяс%",
    "%Мансур%",
    "%СОШ № 54 им. Хасана Кааева%",
    "%Гимназия им. Гумхановой%",
    "%ИП Турсултанова Хеди%",
    "%ИП Тепсаева Л.Х.%",
    "%Гимназия №13%",
]

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
print('Checking target schools...')
for patt in patterns:
    cur.execute(
        "SELECT s.id, s.name, d.name as district, s.latitude, s.longitude, s.coords FROM schools s LEFT JOIN districts d ON s.district_id = d.id WHERE s.name ILIKE %s ORDER BY s.id",
        (patt,)
    )
    rows = cur.fetchall()
    print('\nPATTERN:', patt)
    if not rows:
        print('  NOT FOUND')
    else:
        for row in rows:
            print(' ', row)

cur.close()
conn.close()
