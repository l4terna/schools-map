from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import patch

import pandas as pd
import pytest

from parser import parse_excel, _parse_new_flat_format, _parse_legacy_format


MOCK_DISTRICT_MAP = {
    "Грозный (город)": 1,
    "Аргун (город)": 2,
}


@pytest.fixture(autouse=True)
def _mock_district_map():
    with patch("parser.load_district_id_map", return_value=MOCK_DISTRICT_MAP):
        yield


def _write_xlsx(rows: list[list]) -> str:
    path = tempfile.mktemp(suffix=".xlsx")
    pd.DataFrame(rows).to_excel(path, index=False, header=False)
    return path


# ── New flat format ──────────────────────────────────────────────


FLAT_HEADER = [
    "school_name", "shift_count", "power", "student_count",
    "employee_count", "edu_employee_count", "page_link",
    "latitude", "longitude", "adress", "district", "is_state", "is_religional",
]


def test_flat_normal_row():
    path = _write_xlsx([
        FLAT_HEADER,
        ["School A", 1, 500, 300, 50, 30, "http://a.com", "43.3", "45.7", "addr", "Грозный (город)", "да", "нет"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    s = result["schools"][0]
    assert s["name"] == "School A"
    assert s["district"] == "Грозный (город)"
    assert s["students"] == 300


def test_flat_missing_name_with_district_still_loaded():
    """School with no name but with district should still load."""
    path = _write_xlsx([
        FLAT_HEADER,
        [None, 2, 400, 200, 40, 20, None, None, None, None, "Грозный (город)", "нет", "нет"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    s = result["schools"][0]
    assert s["name"] is None
    assert s["district"] == "Грозный (город)"
    assert s["students"] == 200


def test_flat_missing_district_with_coords_still_loaded():
    """School with no district but with coords should still load."""
    path = _write_xlsx([
        FLAT_HEADER,
        ["School B", 1, 300, 100, 20, 10, None, "43.3", "45.7", None, None, "да", "нет"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    s = result["schools"][0]
    assert s["name"] == "School B"
    assert s["district"] is None
    assert s["coords"] == (43.3, 45.7)


def test_flat_no_district_no_coords_skipped():
    """School with neither district nor coords should be skipped."""
    path = _write_xlsx([
        FLAT_HEADER,
        ["School X", 1, 300, 100, 20, 10, None, None, None, None, None, "да", "нет"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 0


def test_flat_all_fields_null_dropped():
    """Completely empty row is dropped by dropna(how='all') — expected."""
    path = _write_xlsx([
        FLAT_HEADER,
        [None, None, None, None, None, None, None, None, None, None, None, None, None],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 0


def test_flat_district_aggregation_skips_null_district():
    """Schools without district should not break district aggregation."""
    path = _write_xlsx([
        FLAT_HEADER,
        ["School A", 1, 500, 300, 50, 30, None, "43.3", "45.7", None, "Грозный (город)", "да", "нет"],
        ["School B", 1, 300, 100, 20, 10, None, "43.4", "45.8", None, None, "да", "нет"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 2
    grozny = next(d for d in result["districts"] if d["name"] == "Грозный (город)")
    assert grozny["students"] == 300


def test_flat_mixed_rows():
    """Mix of complete, partial, and skipped rows."""
    path = _write_xlsx([
        FLAT_HEADER,
        ["School A", 1, 500, 300, 50, 30, "http://a.com", "43.3", "45.7", "addr", "Грозный (город)", "да", "нет"],
        [None, 2, 400, 200, 40, 20, None, None, None, None, "Аргун (город)", "нет", "нет"],
        ["School C", None, None, None, None, None, None, None, None, None, None, "нет", "нет"],
    ])
    result = parse_excel(path)
    # School A: has district+coords, School B(None): has district, School C: no district no coords — skipped
    assert len(result["schools"]) == 2


# ── Legacy format ────────────────────────────────────────────────


def _legacy_header():
    return ["№", "Название", "Смена", "Мощность", "Ученики", "Работники", "Учителя", "Сайт", "Гос", "Адрес", "Координаты"]


def test_legacy_normal_row():
    path = _write_xlsx([
        _legacy_header(),
        [1, "School A", 1, 500, 300, 50, 30, "http://a.com", "да", "addr", "43.3,45.7"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    assert result["schools"][0]["name"] == "School A"


def test_legacy_with_district_no_coords_loaded():
    """Row under a district but without coords should still load."""
    path = _write_xlsx([
        _legacy_header(),
        [None, "Грозный (город)", None, None, 5000, 500, 200, None, None, None, None],
        [1, None, 1, 500, 300, 50, 30, None, "нет", None, None],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    s = result["schools"][0]
    assert s["name"] is None
    assert s["district"] == "Грозный (город)"


def test_legacy_no_district_with_coords_loaded():
    """Row without district but with coords should still load."""
    path = _write_xlsx([
        _legacy_header(),
        [1, "School X", None, None, None, 10, 5, None, "нет", None, "43.3,45.7"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    s = result["schools"][0]
    assert s["name"] == "School X"
    assert s["district"] is None
    assert s["coords"] == (43.3, 45.7)


def test_legacy_no_district_no_coords_skipped():
    """Row without district and without coords should be skipped."""
    path = _write_xlsx([
        _legacy_header(),
        [1, "School X", 1, 500, 300, 50, 30, None, "нет", None, None],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 0


def test_legacy_district_rows_still_detected():
    """District rows should still be parsed as districts, not schools."""
    path = _write_xlsx([
        _legacy_header(),
        [None, "Грозный (город)", None, None, 5000, 500, 200, None, None, None, None],
        [1, "School A", 1, 500, 300, 50, 30, None, "да", None, "43.3,45.7"],
    ])
    result = parse_excel(path)
    assert len(result["schools"]) == 1
    assert result["schools"][0]["name"] == "School A"
    grozny = next(d for d in result["districts"] if d["name"] == "Грозный (город)")
    assert grozny["students"] == 5000
