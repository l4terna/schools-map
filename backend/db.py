import psycopg


def load_data():
    conn = psycopg.connect(
        host="localhost",
        dbname="schools_db",
        user="postgres",
        password="Dzhabrailov07"
    )

    cur = conn.cursor()

    # Районы
    cur.execute("""
        SELECT
            id,
            name
        FROM districts
        ORDER BY id
    """)

    districts = []

    for row in cur.fetchall():
        districts.append({
            "id": row[0],
            "name": row[1]
        })

    # Школы + название района
    cur.execute("""
        SELECT
            s.id,
            s.name,
            d.name,
            s.latitude,
            s.longitude,
            s.students
        FROM schools s
        LEFT JOIN districts d
        ON s.district_id = d.id
    """)

    schools = []

    for row in cur.fetchall():
        schools.append({
            "id": row[0],
            "name": row[1],
            "district": row[2],
            "latitude": row[3],
            "longitude": row[4],
            "students": row[5]
        })

    cur.close()
    conn.close()

    return {
        "districts": districts,
        "schools": schools
    }