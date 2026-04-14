import { useState, useMemo } from "react";
import { useGetDataAllQuery } from "@/store/api/schoolsApi";
import { DISTRICT_GEO } from "@/data/districts";
import type { District, School } from "@/types";

export interface DistrictRow {
	district: District;
	shortName: string;
	color: string;
	schoolCount: number;
	totalCapacity: number;
	fillRate: number;
	schools: School[];
	buildings: number;
	repairBuildings: number;
	criticalBuildings: number;
	repairBuildingsRate: number;
	criticalBuildingsRate: number;
	secondShiftStudents: number;
	repairSchools: number;
	repairCapacity: number;
	formSchools: number;
	formCapacity: number;
}

export interface DashboardTotals {
	students: number;
	capacity: number;
	teachers: number;
	workers: number;
	schools: number;
	fillRate: number;
	demand: number;
	districts: number;
	buildings: number;
	repairBuildings: number;
	criticalBuildings: number;
	repairBuildingsRate: number;
	criticalBuildingsRate: number;
	secondShiftStudents: number;
	repairSchools: number;
	repairCapacity: number;
	formSchools: number;
	formCapacity: number;
}

export function useDashboardData() {
	const { data, isLoading } = useGetDataAllQuery();
	const [districtQuery, setDistrictQuery] = useState("");
	const [schoolQuery, setSchoolQuery] = useState("");
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const rows = useMemo<DistrictRow[]>(() => {
		if (!data) return [];
		return data.districts
			.filter((d) => d.id !== null)
			.map((district) => {
				const geo = DISTRICT_GEO[district.name];
				const schools = data.schools.filter(
					(s) => s.district === district.name,
				);
				const totalCapacity = schools.reduce(
					(s, x) => s + (x.capacity ?? 0),
					0,
				);
				const buildings = schools.reduce(
					(sum, school) => sum + (school.buildings ?? 0),
					0,
				);
				const repairBuildings = schools.reduce(
					(sum, school) =>
						sum + (school.needs_repairs ? (school.buildings ?? 0) : 0),
					0,
				);
				const criticalBuildings = schools.reduce(
					(sum, school) =>
						sum + (school.critical_condition ? (school.buildings ?? 0) : 0),
					0,
				);
				const secondShiftStudents = schools.reduce(
					(sum, school) => sum + (school.second_shift_students ?? 0),
					0,
				);
				const repairSchools = schools.filter(
					(school) => school.needs_repairs,
				).length;
				const repairCapacity = schools.reduce(
					(sum, school) =>
						sum + (school.needs_repairs ? (school.capacity ?? 0) : 0),
					0,
				);
				const formSchools = schools.filter((school) => school.form).length;
				const formCapacity = schools.reduce(
					(sum, school) => sum + (school.form ? (school.capacity ?? 0) : 0),
					0,
				);
				const students = district.students ?? 0;
				const fillRate =
					totalCapacity > 0 ? (students / totalCapacity) * 100 : 0;
				return {
					district,
					shortName: geo?.shortName ?? district.name,
					color: geo?.color ?? "#3b82f6",
					schoolCount: schools.length,
					totalCapacity,
					fillRate,
					schools,
					buildings,
					repairBuildings,
					criticalBuildings,
					repairBuildingsRate:
						buildings > 0 ? (repairBuildings / buildings) * 100 : 0,
					criticalBuildingsRate:
						buildings > 0 ? (criticalBuildings / buildings) * 100 : 0,
					secondShiftStudents,
					repairSchools,
					repairCapacity,
					formSchools,
					formCapacity,
				};
			});
	}, [data]);

	const sorted = useMemo(() => {
		const q = districtQuery.toLowerCase();
		return [...rows]
			.filter((r) => !q || r.shortName.toLowerCase().includes(q))
			.sort((a, b) => a.fillRate - b.fillRate);
	}, [rows, districtQuery]);

	const totals = useMemo<DashboardTotals>(() => {
		const students = rows.reduce((s, r) => s + (r.district.students ?? 0), 0);
		const capacity = rows.reduce((s, r) => s + r.totalCapacity, 0);
		const teachers = rows.reduce((s, r) => s + (r.district.teachers ?? 0), 0);
		const workers = rows.reduce((s, r) => s + (r.district.workers ?? 0), 0);
		const schools = rows.reduce((s, r) => s + r.schoolCount, 0);
		const buildings = rows.reduce((s, r) => s + r.buildings, 0);
		const repairBuildings = rows.reduce((s, r) => s + r.repairBuildings, 0);
		const criticalBuildings = rows.reduce((s, r) => s + r.criticalBuildings, 0);
		const secondShiftStudents = rows.reduce(
			(s, r) => s + r.secondShiftStudents,
			0,
		);
		const repairSchools = rows.reduce((s, r) => s + r.repairSchools, 0);
		const repairCapacity = rows.reduce((s, r) => s + r.repairCapacity, 0);
		const formSchools = rows.reduce((s, r) => s + r.formSchools, 0);
		const formCapacity = rows.reduce((s, r) => s + r.formCapacity, 0);
		const fillRate = capacity > 0 ? (students / capacity) * 100 : 0;
		const demand = Math.max(0, students - capacity);
		return {
			students,
			capacity,
			teachers,
			workers,
			schools,
			fillRate,
			demand,
			districts: rows.length,
			buildings,
			repairBuildings,
			criticalBuildings,
			repairBuildingsRate:
				buildings > 0 ? (repairBuildings / buildings) * 100 : 0,
			criticalBuildingsRate:
				buildings > 0 ? (criticalBuildings / buildings) * 100 : 0,
			secondShiftStudents,
			repairSchools,
			repairCapacity,
			formSchools,
			formCapacity,
		};
	}, [rows]);

	const selected =
		selectedId !== null
			? (rows.find((r) => r.district.id === selectedId) ?? null)
			: null;

	const sortedSchools = useMemo(() => {
		if (!selected) return [];
		const q = schoolQuery.toLowerCase();
		return [...selected.schools]
			.filter(
				(s) =>
					!q ||
					s.name.toLowerCase().includes(q) ||
					(s.address && s.address.toLowerCase().includes(q)),
			)
			.sort((a, b) => a.name.localeCompare(b.name, "ru"));
	}, [selected, schoolQuery]);

	return {
		isLoading,
		rows,
		sorted,
		totals,
		selected,
		sortedSchools,
		selectedId,
		setSelectedId,
		districtQuery,
		setDistrictQuery,
		schoolQuery,
		setSchoolQuery,
	};
}

export function fmt(v: number | null) {
	return v != null ? v.toLocaleString("ru") : "—";
}

export function schoolWord(n: number): string {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	if (abs > 10 && abs < 20) return "школ";
	if (last === 1) return "школа";
	if (last >= 2 && last <= 4) return "школы";
	return "школ";
}
