import psycopg

updates = [
    # These schools should be in Grozny city, not Groznenky district
    (190, 12, 43.333070, 45.719598, '43.333070,45.719598'),
    (209, 12, 43.313470, 45.688520, '43.313470,45.688520'),
    (201, 12, 43.316280, 45.697805, '43.316280,45.697805'),
    (212, 12, 43.289650, 45.677415, '43.289650,45.677415'),
    # These belong to Achkhoy-Martanovsky district, not Grozny
    (283, 22, 43.190571, 45.270845, '43.190571,45.270845'),
    (273, 22, 43.195330, 45.293635, '43.195330,45.293635'),
    # School 54 in Grozny has wrong coordinates and should remain in Grozny
    (240, 12, 43.279687, 45.733575, '43.279687,45.733575'),
    # Urus-Martanovsky schools need adjusted coordinates inside their district
    (565, 13, 43.136517, 45.527754, '43.136517,45.527754'),
    (570, 13, 43.157099, 45.471223, '43.157099,45.471223'),
    (571, 13, 43.090166, 45.353068, '43.090166,45.353068'),
    # Argun city school needs coordinates moved into Argun
    (117, 27, 43.308259, 45.892973, '43.308259,45.892973'),
]

conn = psycopg.connect(host='localhost', port='5432', dbname='schools_db', user='postgres', password='Dzhabrailov07')
cur = conn.cursor()
for school_id, district_id, lat, lng, coords in updates:
    cur.execute(
        "UPDATE schools SET district_id = %s, latitude = %s, longitude = %s, coords = %s WHERE id = %s",
        (district_id, lat, lng, coords, school_id),
    )
    print('Updated', school_id)
conn.commit()
cur.close()
conn.close()
