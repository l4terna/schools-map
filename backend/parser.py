from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

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


DISTRICT_ID_MAP: dict[str, int] = {
    "Департамент образования Мэрии г.Грозного": 1,
    "Департамент образования г. Аргун": 2,
    "Итум-Калинский районный отдел образования": 3,
    "МУ 'Веденский РОО'": 4,
    "МУ 'Надтеречное РУО'": 5,
    "МУ 'Отдел образования Серноводского муниципального района'": 6,
    "МУ 'Отдел образования Шалинского муниципального района'": 7,
    "МУ 'Отдел образования Шатойского муниципального района'": 8,
    "МУ 'Шаройский районный отдел образования'": 9,
    "МУ «Грозненское РУО»": 10,
    "МУ «Урус-Мартановское РУО»": 11,
    "МУ»Управление образования Гудермесского муниципального района»": 12,
    "Наурское РУО": 13
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


def _to_str(value: Any) -> str | None:
    if _is_nan(value):
        return None
    
    text = str(value).strip()

    return text or None


def _to_bool_state(value: Any) -> bool:
    text = _to_str(value)
    if not text:
        return False
    return text.lower() == "да"


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


def _cell(row: list[Any], idx: int) -> Any:
    return row[idx] if idx < len(row) else None


def _is_district_row(name: str | None, site: str | None) -> bool:
    if not name:
        return False

    name_stripped = name.strip()

    if name_stripped.lower() == "всего":
        return False

    if site:
        return False

    return name_stripped in DISTRICT_ID_MAP


def parse_excel(path: str) -> dict[str, Any]:
    df = pd.read_excel(path, header=None)

    header = df.iloc[0].tolist()
    
    districts: list[District] = []
    schools: list[School] = []

    current_district: District | None = None

    for idx in range(1, len(df)):
        row = df.iloc[idx].tolist()
        row_id = row[0]

        name = _to_str(_cell(row, 1))
        name_stripped = name.strip() if name else None
        if _is_nan(row_id) and _is_district_row(name, _to_str(_cell(row, 7))):
            current_district = District(
                id=DISTRICT_ID_MAP.get(name_stripped),
                name=name_stripped,
                students=_to_int(_cell(row, 4)),
                workers=_to_int(_cell(row, 5)),
                teachers=_to_int(_cell(row, 6))
            )
            
            districts.append(current_district)
            
            continue

        if not name:
            continue

        if _is_nan(row_id):
            if _is_nan(_cell(row, 2)) and _is_nan(_cell(row, 3)) and _is_nan(_cell(row, 4)):
                continue

        school = School(
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

        schools.append(school)

    return {
        "meta": {
            "columns": header,
            "districts_count": len(districts),
            "schools_count": len(schools),
        },
        "districts": sorted(
            [asdict(district) for district in districts], 
            key=lambda d: (d.get("id") is None, d.get("id"))
        ),
        "schools": [asdict(s) for s in schools],
    }


if __name__ == "__main__":
    import json
    import sys

    source = sys.argv[1] if len(sys.argv) > 1 else "data.xlsx"
    payload = parse_excel(source)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
