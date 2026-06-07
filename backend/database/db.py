import psycopg


def get_connection():
    return psycopg.connect(
        host="localhost",
        port="5432",
        dbname="schools_db",
        user="postgres",
        password="Dzhabrailov07"
    )