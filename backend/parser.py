from __future__ import annotations

from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import json
import math

import pandas as pd


@dataclass
class School:
    name: str
    shift: int | None
    capacity: int | None
    students: int | None
    workers: int | None
    teachers: int | None
    site: str | None
    district: str | None
    is_state: bool
    address: str | None = None
    coords: tuple[float, float] | None = None


@dataclass
class District:
    id: int | None
    name: str
    students: int | None
    teachers: int | None
    workers: int | None


DISTRICTS_DATA_PATH = Path(__file__).resolve().parent / "data" / "districts.json"


@lru_cache
def load_district_id_map() -> dict[str, int]:
    with DISTRICTS_DATA_PATH.open(encoding="utf-8") as source:
        districts = json.load(source)

    return {
        item["name"]: item["id"]
        for item in districts
        if item.get("name") and item.get("id") is not None
    }


def _is_nan(value: Any) -> bool:
    return value is None or (isinstance(value, float) and math.isnan(value))


def _to_int(value: Any) -> int | None:
    if _is_nan(value):
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value: Any) -> float | None:
    if _is_nan(value):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_str(value: Any) -> str | None:
    if _is_nan(value):
        return None

    text = str(value).strip()
    return text or None


def _is_filled(value: Any) -> bool:
    if _is_nan(value):
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


def _to_bool_state(value: Any) -> bool:
    text = _to_str(value)
    if not text:
        return False
    return text.lower() in {"да", "yes", "true", "1"}


def _parse_coords(value: Any) -> tuple[float, float] | None:
    text = _to_str(value)
    if not text:
        return None
    parts = [p.strip() for p in text.replace(";", ",").split(",")]
    if len(parts) != 2:
        return None
    try:
        lat = float(parts[0])
        lon = float(parts[1])
    except ValueError:
        return None
    return (lat, lon)


def _normalize_header(value: Any) -> str:
    text = _to_str(value)
    if not text:
        return ""
    return text.lower().replace(" ", "_")


def _cell(row: list[Any], idx: int | None) -> Any:
    if idx is None:
        return None
    return row[idx] if idx < len(row) else None


def _is_district_row(name: str | None, site: str | None, district_id_map: dict[str, int]) -> bool:
    if not name:
        return False

    name_stripped = name.strip()

    if name_stripped.lower() == "всего":
        return False

    if site:
        return False

    return name_stripped in district_id_map


def _payload(
    header: list[Any],
    districts: list[District],
    schools: list[School],
    district_id_map: dict[str, int],
) -> dict[str, Any]:
    by_name: dict[str, District] = {}
    for district in districts:
        by_name[district.name] = district

    for name, district_id in district_id_map.items():
        if name in by_name:
            current = by_name[name]
            if current.id is None:
                current.id = district_id
            continue

        by_name[name] = District(
            id=district_id,
            name=name,
            students=0,
            teachers=0,
            workers=0,
        )

    merged_districts = list(by_name.values())

    return {
        "meta": {
            "columns": header,
            "districts_count": len(merged_districts),
            "schools_count": len(schools),
        },
        "districts": sorted(
            [asdict(district) for district in merged_districts],
            key=lambda d: (d.get("id") is None, d.get("id")),
        ),
        "schools": [asdict(school) for school in schools],
    }


def _parse_legacy_format(df: pd.DataFrame, district_id_map: dict[str, int]) -> dict[str, Any]:
    header = df.iloc[0].tolist()

    districts: list[District] = []
    schools: list[School] = []
    current_district: District | None = None

    for idx in range(1, len(df)):
        row = df.iloc[idx].tolist()
        row_id = row[0]

        name = _to_str(_cell(row, 1))
        name_stripped = name.strip() if name else None

        if _is_nan(row_id) and _is_district_row(name, _to_str(_cell(row, 7)), district_id_map):
            current_district = District(
                id=district_id_map.get(name_stripped),
                name=name_stripped,
                students=_to_int(_cell(row, 4)),
                workers=_to_int(_cell(row, 5)),
                teachers=_to_int(_cell(row, 6)),
            )
            districts.append(current_district)
            continue

        if not name:
            continue

        if _is_nan(row_id):
            if _is_nan(_cell(row, 2)) and _is_nan(_cell(row, 3)) and _is_nan(_cell(row, 4)):
                continue

        schools.append(
            School(
                name=name_stripped or name,
                shift=_to_int(_cell(row, 2)),
                capacity=_to_int(_cell(row, 3)),
                students=_to_int(_cell(row, 4)),
                workers=_to_int(_cell(row, 5)),
                teachers=_to_int(_cell(row, 6)),
                site=_to_str(_cell(row, 7)),
                district=current_district.name if current_district else None,
                is_state=_to_bool_state(_cell(row, 8)),
                address=_to_str(_cell(row, 9)),
                coords=_parse_coords(_cell(row, 10)),
            )
        )

    return _payload(header, districts, schools, district_id_map)


def _parse_new_flat_format(df: pd.DataFrame, district_id_map: dict[str, int]) -> dict[str, Any]:
    header = df.iloc[0].tolist()
    school_idx = 1
    shift_idx = 2
    capacity_idx = 3
    students_idx = 4
    workers_idx = 5
    teachers_idx = 6
    site_idx = 7

    lat_idx = 8
    lon_idx = 9
    address_idx = 10
    district_idx = 11
    state_idx = 12

    required_idxs = [
        school_idx,
        shift_idx,
        capacity_idx,
        students_idx,
        workers_idx,
        teachers_idx,
        site_idx,
        lat_idx,
        lon_idx,
        address_idx,
        district_idx,
        state_idx,
    ]

    schools: list[School] = []

    for row_num in range(1, len(df)):
        row = df.iloc[row_num].tolist()

        if any(not _is_filled(_cell(row, i)) for i in required_idxs):
            continue

        name = _to_str(_cell(row, school_idx))
        if not name:
            continue

        lat = _to_float(_cell(row, lat_idx))
        lon = _to_float(_cell(row, lon_idx))
        coords = (lat, lon) if lat is not None and lon is not None else None

        schools.append(
            School(
                name=name,
                shift=_to_int(_cell(row, shift_idx)),
                capacity=_to_int(_cell(row, capacity_idx)),
                students=_to_int(_cell(row, students_idx)),
                workers=_to_int(_cell(row, workers_idx)),
                teachers=_to_int(_cell(row, teachers_idx)),
                site=_to_str(_cell(row, site_idx)) or _to_str(_cell(row, 7)),
                district=_to_str(_cell(row, district_idx)),
                is_state=_to_bool_state(_cell(row, state_idx)),
                address=_to_str(_cell(row, address_idx)),
                coords=coords,
            )
        )

    districts_map: dict[str, District] = {}

    for school in schools:
        if not school.district:
            continue

        district_name = school.district.strip()
        district = districts_map.get(district_name)
        if district is None:
            district = District(
                id=district_id_map.get(district_name),
                name=district_name,
                students=0,
                workers=0,
                teachers=0,
            )
            districts_map[district_name] = district

        district.students = (district.students or 0) + (school.students or 0)
        district.workers = (district.workers or 0) + (school.workers or 0)
        district.teachers = (district.teachers or 0) + (school.teachers or 0)

    return _payload(header, list(districts_map.values()), schools, district_id_map)


def parse_excel(path: str) -> dict[str, Any]:
    df = pd.read_excel(path, header=None)
    district_id_map = load_district_id_map()

    if df.empty:
        return _payload([], [], [], district_id_map)

    is_new_flat = df.shape[1] >= 13

    if is_new_flat:
        return _parse_new_flat_format(df, district_id_map)

    return _parse_legacy_format(df, district_id_map)


if __name__ == "__main__":
    import sys

    source = sys.argv[1] if len(sys.argv) > 1 else "data.xlsx"
    payload = parse_excel(source)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
