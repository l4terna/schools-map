"""Database operations service for PostgreSQL integration."""

from typing import Dict, List, Any, Optional
import psycopg
from psycopg import sql


class DBConnectionError(Exception):
    """Raised when database connection fails."""
    pass


class DBValidationError(Exception):
    """Raised when data validation fails."""
    pass


class DatabaseService:
    """Service for all database operations."""

    def __init__(self, connection_params: Dict[str, str]):
        """Initialize DB service with connection parameters.
        
        Args:
            connection_params: dict with keys host, port, dbname, user, password
        """
        self.connection_params = connection_params

    def get_connection(self) -> psycopg.Connection:
        """Get a database connection.
        
        Returns:
            psycopg.Connection instance
            
        Raises:
            DBConnectionError: if connection fails
        """
        try:
            return psycopg.connect(**self.connection_params)
        except psycopg.Error as e:
            raise DBConnectionError(f"Failed to connect to database: {e}")

    def check_connection(self) -> bool:
        """Check if database is accessible.
        
        Returns:
            True if connected, False otherwise
        """
        try:
            conn = self.get_connection()
            conn.close()
            return True
        except DBConnectionError:
            return False

    def get_db_stats(self) -> Dict[str, Any]:
        """Get database statistics.
        
        Returns:
            dict with keys: connected, districts, schools, details
        """
        stats = {"connected": False, "districts": 0, "schools": 0, "details": 0}
        
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            
            # Count districts
            cur.execute("SELECT COUNT(*) FROM districts")
            stats["districts"] = cur.fetchone()[0] or 0
            
            # Count schools
            cur.execute("SELECT COUNT(*) FROM schools")
            stats["schools"] = cur.fetchone()[0] or 0
            
            # Count school details
            cur.execute("SELECT COUNT(*) FROM school_details")
            stats["details"] = cur.fetchone()[0] or 0
            
            stats["connected"] = True
            cur.close()
            conn.close()
        except Exception as e:
            print(f"Error getting DB stats: {e}")
        
        return stats

    def get_all_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all data from database.
        
        Returns:
            dict with keys: republics, districts, schools, school_details
        """
        data = {
            "republics": [],
            "districts": [],
            "schools": [],
            "school_details": []
        }
        
        conn = self.get_connection()
        cur = conn.cursor()
        
        try:
            # Get republics
            cur.execute("SELECT id, name, total_students, total_schools FROM republic ORDER BY id")
            for row in cur.fetchall():
                data["republics"].append({
                    "id": row[0],
                    "name": row[1],
                    "total_students": row[2],
                    "total_schools": row[3]
                })
            
            # Get districts
            cur.execute("SELECT id, name, republic_id FROM districts ORDER BY id")
            for row in cur.fetchall():
                data["districts"].append({
                    "id": row[0],
                    "name": row[1],
                    "republic_id": row[2]
                })
            
            # Get schools
            cur.execute("""
                SELECT id, name, district_id, address, coords, capacity, 
                       students, latitude, longitude 
                FROM schools ORDER BY id
            """)
            for row in cur.fetchall():
                data["schools"].append({
                    "id": row[0],
                    "name": row[1],
                    "district_id": row[2],
                    "address": row[3],
                    "coords": row[4],
                    "capacity": row[5],
                    "students": row[6],
                    "latitude": row[7],
                    "longitude": row[8]
                })
            
            # Get school details
            cur.execute("""
                SELECT id, school_id, shift, second_shift_students, workers, 
                       teachers, site, is_state, is_religious, buildings, 
                       needs_repairs, critical_condition, renovated, shnor, 
                       a_school_with_bias, shkon, form 
                FROM school_details ORDER BY id
            """)
            for row in cur.fetchall():
                data["school_details"].append({
                    "id": row[0],
                    "school_id": row[1],
                    "shift": row[2],
                    "second_shift_students": row[3],
                    "workers": row[4],
                    "teachers": row[5],
                    "site": row[6],
                    "is_state": row[7],
                    "is_religious": row[8],
                    "buildings": row[9],
                    "needs_repairs": row[10],
                    "critical_condition": row[11],
                    "renovated": row[12],
                    "shnor": row[13],
                    "a_school_with_bias": row[14],
                    "shkon": row[15],
                    "form": row[16]
                })
        finally:
            cur.close()
            conn.close()
        
        return data

    def clear_db(self) -> None:
        """Clear all data from database (truncate tables).
        
        Uses TRUNCATE with CASCADE for safe clearing.
        
        Raises:
            Exception: if truncate fails
        """
        conn = self.get_connection()
        cur = conn.cursor()
        
        try:
            # Truncate in correct order (with foreign key constraints)
            cur.execute("TRUNCATE TABLE school_details, schools, districts, republic CASCADE")
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise Exception(f"Failed to clear database: {e}")
        finally:
            cur.close()
            conn.close()

    def validate_data(self, data: Dict[str, List[Dict[str, Any]]]) -> List[str]:
        """Validate data before import.
        
        Args:
            data: dict with republics, districts, schools, school_details
            
        Returns:
            list of validation error messages (empty if valid)
        """
        errors = []
        
        # Validate republics
        if not data.get("republics"):
            errors.append("No republics provided")
        else:
            for i, rep in enumerate(data["republics"]):
                if not rep.get("name"):
                    errors.append(f"Republic #{i} missing name")
        
        # Validate districts
        if not data.get("districts"):
            errors.append("No districts provided")
        else:
            for i, dist in enumerate(data["districts"]):
                if not dist.get("name"):
                    errors.append(f"District #{i} missing name")
                if not dist.get("republic_id"):
                    errors.append(f"District '{dist.get('name', '?')}' missing republic_id")
        
        # Validate schools
        if not data.get("schools"):
            errors.append("No schools provided")
        else:
            for i, school in enumerate(data["schools"]):
                if not school.get("name"):
                    errors.append(f"School #{i} missing name")
                if not school.get("district_id"):
                    errors.append(f"School '{school.get('name', '?')}' missing district_id")
        
        return errors

    def import_data(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        """Import data into database with transaction.
        
        Args:
            data: dict with republics, districts, schools, school_details
            
        Raises:
            DBValidationError: if validation fails
            Exception: if import fails (will rollback)
        """
        # Validate first
        validation_errors = self.validate_data(data)
        if validation_errors:
            raise DBValidationError("Validation errors: " + "; ".join(validation_errors))
        
        conn = self.get_connection()
        cur = conn.cursor()
        
        try:
            # Clear existing data
            cur.execute("TRUNCATE TABLE school_details, schools, districts, republic CASCADE")
            
            # Import republics
            for rep in data.get("republics", []):
                cur.execute(
                    "INSERT INTO republic (id, name, total_students, total_schools) VALUES (%s, %s, %s, %s)",
                    (rep.get("id"), rep.get("name"), rep.get("total_students"), rep.get("total_schools"))
                )
            
            # Import districts
            for dist in data.get("districts", []):
                cur.execute(
                    "INSERT INTO districts (id, name, republic_id) VALUES (%s, %s, %s)",
                    (dist.get("id"), dist.get("name"), dist.get("republic_id"))
                )
            
            # Import schools
            for school in data.get("schools", []):
                cur.execute(
                    """INSERT INTO schools 
                       (id, name, district_id, address, coords, capacity, students, latitude, longitude) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        school.get("id"),
                        school.get("name"),
                        school.get("district_id"),
                        school.get("address"),
                        school.get("coords"),
                        school.get("capacity"),
                        school.get("students"),
                        school.get("latitude"),
                        school.get("longitude")
                    )
                )
            
            # Import school details
            for detail in data.get("school_details", []):
                cur.execute(
                    """INSERT INTO school_details 
                       (id, school_id, shift, second_shift_students, workers, teachers, site, 
                        is_state, is_religious, buildings, needs_repairs, critical_condition, 
                        renovated, shnor, a_school_with_bias, shkon, form) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        detail.get("id"),
                        detail.get("school_id"),
                        detail.get("shift"),
                        detail.get("second_shift_students"),
                        detail.get("workers"),
                        detail.get("teachers"),
                        detail.get("site"),
                        detail.get("is_state", False),
                        detail.get("is_religious", False),
                        detail.get("buildings"),
                        detail.get("needs_repairs", False),
                        detail.get("critical_condition", False),
                        detail.get("renovated", False),
                        detail.get("shnor", False),
                        detail.get("a_school_with_bias", False),
                        detail.get("shkon", False),
                        detail.get("form", False)
                    )
                )
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise Exception(f"Failed to import data: {e}")
        finally:
            cur.close()
            conn.close()
