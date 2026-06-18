"""Excel import/export service for Schools Map backend."""

from io import BytesIO
from pathlib import Path
from typing import Dict, List, Any

import pandas as pd


class ExcelValidationError(Exception):
    """Raised when Excel validation fails."""
    pass


REPUBLIC_SHEET = "Republic"
DISTRICTS_SHEET = "Districts"
SCHOOLS_SHEET = "Schools"
DETAILS_SHEET = "School Details"

REPUBLIC_COLUMNS = ["id", "name", "total_students", "total_schools"]
DISTRICT_COLUMNS = ["id", "name", "republic_id"]
SCHOOL_COLUMNS = [
    "id",
    "name",
    "district_id",
    "address",
    "coords",
    "capacity",
    "students",
    "latitude",
    "longitude",
]
DETAIL_COLUMNS = [
    "id",
    "school_id",
    "shift",
    "second_shift_students",
    "workers",
    "teachers",
    "site",
    "is_state",
    "is_religious",
    "buildings",
    "needs_repairs",
    "critical_condition",
    "renovated",
    "shnor",
    "a_school_with_bias",
    "shkon",
    "form",
]


def _normalize_headers(header_values: List[Any]) -> List[str]:
    return [str(value).strip() for value in header_values]


def _validate_columns(sheet_name: str, columns: List[str], actual: List[str]) -> None:
    missing = [col for col in columns if col not in actual]
    if missing:
        raise ExcelValidationError(
            f"Sheet '{sheet_name}' is missing required columns: {', '.join(missing)}"
        )


def _normalize_coords(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        parts = [p.strip() for p in text.replace(";", ",").split(",")]
        if len(parts) != 2:
            return None
        return ",".join(parts)
    if isinstance(value, (list, tuple)) and len(value) == 2:
        return f"{value[0]},{value[1]}"
    return str(value)


def parse_excel(path: str) -> Dict[str, List[Dict[str, Any]]]:
    """Parse a structured Excel file from disk.
    
    Args:
        path: path to the Excel file
    
    Returns:
        structured dict containing republics, districts, schools, school_details
    """
    excel_path = Path(path)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {path}")

    workbook = pd.read_excel(path, sheet_name=None)
    required_sheets = {REPUBLIC_SHEET, DISTRICTS_SHEET, SCHOOLS_SHEET, DETAILS_SHEET}
    missing_sheets = required_sheets - set(workbook.keys())
    if missing_sheets:
        raise ExcelValidationError(
            f"Missing required sheets: {', '.join(sorted(missing_sheets))}"
        )

    republic_df = workbook[REPUBLIC_SHEET]
    district_df = workbook[DISTRICTS_SHEET]
    schools_df = workbook[SCHOOLS_SHEET]
    details_df = workbook[DETAILS_SHEET]

    republic_columns = _normalize_headers(republic_df.columns.tolist())
    district_columns = _normalize_headers(district_df.columns.tolist())
    school_columns = _normalize_headers(schools_df.columns.tolist())
    detail_columns = _normalize_headers(details_df.columns.tolist())

    _validate_columns(REPUBLIC_SHEET, REPUBLIC_COLUMNS, republic_columns)
    _validate_columns(DISTRICTS_SHEET, DISTRICT_COLUMNS, district_columns)
    _validate_columns(SCHOOLS_SHEET, SCHOOL_COLUMNS, school_columns)
    _validate_columns(DETAILS_SHEET, DETAIL_COLUMNS, detail_columns)

    republics = republic_df.rename(columns={c: str(c).strip() for c in republic_df.columns}).to_dict(orient="records")
    districts = district_df.rename(columns={c: str(c).strip() for c in district_df.columns}).to_dict(orient="records")
    schools = schools_df.rename(columns={c: str(c).strip() for c in schools_df.columns}).to_dict(orient="records")
    details = details_df.rename(columns={c: str(c).strip() for c in details_df.columns}).to_dict(orient="records")

    for school in schools:
        school["coords"] = _normalize_coords(school.get("coords"))

    return {
        "republics": republics,
        "districts": districts,
        "schools": schools,
        "school_details": details,
    }


def generate_excel(data: Dict[str, List[Dict[str, Any]]]) -> bytes:
    """Generate an Excel file bytes payload from structured data.
    
    Args:
        data: dict with republics, districts, schools, school_details
    
    Returns:
        Excel file bytes
    """
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(data.get("republics", [])).to_excel(
            writer, sheet_name=REPUBLIC_SHEET, index=False
        )
        pd.DataFrame(data.get("districts", [])).to_excel(
            writer, sheet_name=DISTRICTS_SHEET, index=False
        )
        pd.DataFrame(data.get("schools", [])).to_excel(
            writer, sheet_name=SCHOOLS_SHEET, index=False
        )
        pd.DataFrame(data.get("school_details", [])).to_excel(
            writer, sheet_name=DETAILS_SHEET, index=False
        )
    output.seek(0)
    return output.read()
