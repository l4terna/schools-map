from __future__ import annotations

from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import json
import math
import re

import pandas as pd


@dataclass
class School:
    name: str | None = None
    shift: int | None = None
    capacity: int | None = None
    students: int | None = None
    workers: int | None = None
    teachers: int | None = None
    site: str | None = None
    district: str | None = None
    is_state: bool = False
    is_religional: bool = False
    address: str | None = None
    coords: tuple[float, float] | None = None
    buildings: int | None = 1
    renovated: bool = False
    needs_repairs: bool = False
    critical_condition: bool = False
    second_shift_students: int | None = None
    form: bool = False
    shkon: bool = False
    a_school_with_bias: bool = False


@dataclass
class District:
    id: int | None
    name: str
    students: int | None
    teachers: int | None
    workers: int | None


DISTRICTS_DATA_PATH = Path(__file__).resolve().parent / "data" / "districts.json"
CANONICAL_GROZNY_DISTRICT = "Грозный (город)"
GROZNY_INTERNAL_DISTRICTS = {
    "Ахматовский р-н",
    "Висаитовский р-н",
    "Шейх-Мансуровский р-н",
    "Байсангуровский р-н",
}
GROZNY_NAME_ALIASES = {
    "грозный",
    "г. грозный",
    "город грозный",
    "грозный (город)",
    "городской округ грозный",
}
NEGATIVE_PRESENCE_BOOL_VALUES = {
    "-",
    "—",
    "0",
    "0.0",
    "false",
    "n",
    "no",
    "ytn",
    "нет",
    "нет.",
    "ложь",
    "не отремонтирована",
    "не отремонтировано",
    "не отремонтирован",
    "не проводился",
    "не проводилась",
    "не проводилось",
    "не требуется",
    "не требует",
    "не требуются",
    "нет необходимости",
    "отсутствует",
}


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


def _normalize_district_name(value: str | None) -> str | None:
    if not value:
        return None

    name = value.strip()
    normalized = re.sub(r"\s+", " ", name.lower()).strip()

    if name in GROZNY_INTERNAL_DISTRICTS or normalized in GROZNY_NAME_ALIASES:
        return CANONICAL_GROZNY_DISTRICT

    return name


def _is_filled(value: Any) -> bool:
    if _is_nan(value):
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


def _to_bool(value: Any) -> bool:
    text = _to_str(value)
    if not text:
        return False
    return text.lower() in {"да", "yes", "true", "1", "y", "истина"}


def _to_bool_by_presence(value: Any) -> bool:
    """Treat any filled repair marker as true except common explicit negatives."""
    text = _to_str(value)
    if not text:
        return False

    normalized = re.sub(r"\s+", " ", text.lower()).strip(" .;,:")
    if normalized in NEGATIVE_PRESENCE_BOOL_VALUES:
        return False

    return not normalized.startswith(
        ("нет ", "нет/", "нет-", "не треб", "не отремонт", "не провод")
    )


def _to_bool_state(value: Any) -> bool:
    return _to_bool(value)


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
    return re.sub(r"[^0-9a-zа-я]+", "_", text.lower()).strip("_")


def _header_index(header: list[Any], *names: str, fallback: int | None = None) -> int | None:
    normalized = {_normalize_header(name) for name in names}
    for idx, value in enumerate(header):
        if _normalize_header(value) in normalized:
            return idx
    return fallback


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

    return name_stripped in district_id_map or _normalize_district_name(name_stripped) in district_id_map


def _buildings_count(value: Any) -> int:
    parsed = _to_int(value)
    return parsed if parsed is not None else 1


def _payload(
    header: list[Any],
    districts: list[District],
    schools: list[School],
    district_id_map: dict[str, int],
) -> dict[str, Any]:
    by_name: dict[str, District] = {}

    for district in districts:
        normalized_name = _normalize_district_name(district.name) or district.name
        current = by_name.get(normalized_name)
        if current is None:
            by_name[normalized_name] = District(
                id=district_id_map.get(normalized_name, district.id),
                name=normalized_name,
                students=district.students or 0,
                teachers=district.teachers or 0,
                workers=district.workers or 0,
            )
            continue

        current.students = (current.students or 0) + (district.students or 0)
        current.teachers = (current.teachers or 0) + (district.teachers or 0)
        current.workers = (current.workers or 0) + (district.workers or 0)

    for name, district_id in district_id_map.items():
        normalized_name = _normalize_district_name(name)
        if not normalized_name or normalized_name != name:
            continue

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
            district_name = _normalize_district_name(name_stripped)
            current_district = District(
                id=district_id_map.get(district_name),
                name=district_name or name_stripped,
                students=_to_int(_cell(row, 4)),
                workers=_to_int(_cell(row, 5)),
                teachers=_to_int(_cell(row, 6)),
            )
            districts.append(current_district)
            continue

        district_name = _normalize_district_name(current_district.name) if current_district else None
        coords = _parse_coords(_cell(row, 10))

        if not district_name and coords is None:
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
                district=district_name,
                is_state=_to_bool(_cell(row, 8)),
                address=_to_str(_cell(row, 9)),
                coords=coords,
            )
        )

    return _payload(header, districts, schools, district_id_map)


def _parse_new_flat_format(df: pd.DataFrame, district_id_map: dict[str, int]) -> dict[str, Any]:
    header = df.iloc[0].tolist()

    school_idx = _header_index(header, "school_name", fallback=1)
    shift_idx = _header_index(header, "shift_count", fallback=2)
    capacity_idx = _header_index(header, "power", fallback=3)
    students_idx = _header_index(header, "student_count", fallback=4)
    workers_idx = _header_index(header, "employee_count", fallback=5)
    teachers_idx = _header_index(header, "edu_employee_count", fallback=6)
    site_idx = _header_index(header, "page_link", fallback=7)
    lat_idx = _header_index(header, "latitude", fallback=8)
    lon_idx = _header_index(header, "longitude", fallback=9)
    address_idx = _header_index(header, "adress", "address", fallback=10)
    district_idx = _header_index(header, "district", fallback=11)
    state_idx = _header_index(header, "is_state", fallback=12)
    religional_idx = _header_index(header, "is_religional", fallback=13)
    buildings_idx = _header_index(header, "buildings")
    renovated_idx = _header_index(header, "renovated")
    needs_repairs_idx = _header_index(header, "needs_repairs")
    critical_condition_idx = _header_index(header, "critical_condition")
    second_shift_idx = _header_index(header, "second_shift(students)", "second_shift_students")
    form_idx = _header_index(header, "form")
    shkon_idx = _header_index(header, "SHKON", "shkon")
    bias_idx = _header_index(header, "A_school_with_bias", "a_school_with_bias")

    schools: list[School] = []

    for row_num in range(1, len(df)):
        row = df.iloc[row_num].tolist()

        name = _to_str(_cell(row, school_idx))
        district_name = _normalize_district_name(_to_str(_cell(row, district_idx)))

        lat = _to_float(_cell(row, lat_idx))
        lon = _to_float(_cell(row, lon_idx))
        coords = (lat, lon) if lat is not None and lon is not None else None

        if not district_name and coords is None:
            continue

        schools.append(
            School(
                name=name,
                shift=_to_int(_cell(row, shift_idx)),
                capacity=_to_int(_cell(row, capacity_idx)),
                students=_to_int(_cell(row, students_idx)),
                workers=_to_int(_cell(row, workers_idx)),
                teachers=_to_int(_cell(row, teachers_idx)),
                site=_to_str(_cell(row, site_idx)),
                district=district_name,
                is_state=_to_bool(_cell(row, state_idx)),
                is_religional=_to_bool(_cell(row, religional_idx)),
                address=_to_str(_cell(row, address_idx)),
                coords=coords,
                buildings=_buildings_count(_cell(row, buildings_idx)),
                renovated=_to_bool_by_presence(_cell(row, renovated_idx)),
                needs_repairs=_to_bool_by_presence(_cell(row, needs_repairs_idx)),
                critical_condition=_to_bool(_cell(row, critical_condition_idx)),
                second_shift_students=_to_int(_cell(row, second_shift_idx)),
                form=_to_bool(_cell(row, form_idx)),
                shkon=_to_bool(_cell(row, shkon_idx)),
                a_school_with_bias=_to_bool(_cell(row, bias_idx)),
            )
        )

    districts_map: dict[str, District] = {}

    for school in schools:
        if not school.district:
            continue

        district_name = school.district
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
    df = df.dropna(how="all").reset_index(drop=True)
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
