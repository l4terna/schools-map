import psycopg
from typing import Dict


def get_connection_params() -> Dict[str, str]:
    return {
        "host": "localhost",
        "port": "5432",
        "dbname": "schools_db",
        "user": "postgres",
        "password": "Dzhabrailov07",
    }


def get_connection():
    return psycopg.connect(**get_connection_params())