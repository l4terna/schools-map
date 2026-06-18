"""Synchronization service for Excel and database data."""

from typing import Dict, Any

from .db_service import DatabaseService, DBValidationError
from .excel_service import parse_excel, generate_excel, ExcelValidationError


class SyncService:
    """Service for synchronizing Excel and database content."""

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def import_excel_to_db(self, path: str) -> None:
        """Import a structured Excel file into PostgreSQL.
        
        This operation clears existing data and imports new data atomically.
        """
        data = parse_excel(path)
        self.db_service.import_data(data)

    def export_db_to_excel(self) -> bytes:
        """Export current database data to a structured Excel file."""
        data = self.db_service.get_all_data()
        return generate_excel(data)

    def validate_excel_file(self, path: str) -> Dict[str, Any]:
        """Validate an Excel file and return compact validation metadata."""
        try:
            data = parse_excel(path)
        except ExcelValidationError as exc:
            return {"valid": False, "errors": [str(exc)]}

        errors = self.db_service.validate_data(data)
        return {"valid": len(errors) == 0, "errors": errors}

    def get_db_status(self) -> Dict[str, Any]:
        """Return current database status information."""
        return self.db_service.get_db_stats()

    def clear_database(self) -> None:
        """Clear all application tables in the database."""
        self.db_service.clear_db()
