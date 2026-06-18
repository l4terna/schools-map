import { useEffect, useMemo, useState } from "react";
import {
	useGetAdminSchoolsQuery,
	useGetAdminDistrictsQuery,
} from "@/store/api/schoolsApi";
import type {
	AdminSchool,
	AdminSchoolsParams,
	SchoolBoolFilters,
	SchoolSortKey,
} from "@/types";
import { SchoolFormModal } from "./SchoolFormModal";

const PAGE_SIZES = [25, 50, 100, 200];

const BOOL_FILTERS: { key: keyof SchoolBoolFilters; label: string }[] = [
	{ key: "is_state", label: "Государственная" },
	{ key: "is_religional", label: "Религиозная" },
	{ key: "renovated", label: "Отремонтирована" },
	{ key: "needs_repairs", label: "Требует ремонта" },
	{ key: "critical_condition", label: "Аварийное" },
	{ key: "form", label: "Строится" },
	{ key: "shkon", label: "ШНОР" },
	{ key: "a_school_with_bias", label: "С необъективностью" },
	{ key: "has_coords", label: "Координаты" },
];

const SORTABLE: { key: SchoolSortKey; label: string; align: string }[] = [
	{ key: "students", label: "Обуч.", align: "text-center" },
	{ key: "capacity", label: "Мощность", align: "text-center" },
	{ key: "workers", label: "Работ.", align: "text-center" },
	{ key: "teachers", label: "Педаг.", align: "text-center" },
];

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
	return (
		<svg
			className={`ml-1 inline h-3 w-3 transition ${active ? "opacity-100" : "opacity-30"}`}
			viewBox="0 0 10 12"
			fill="currentColor"
		>
			{dir === "asc" || !active ? <path d="M5 0L10 6H0z" /> : <path d="M5 12L0 6h10z" />}
		</svg>
	);
}

function fmt(v: number | null) {
	return v != null ? v.toLocaleString("ru") : "—";
}

export function SchoolsManager() {
	const [searchInput, setSearchInput] = useState("");
	const [q, setQ] = useState("");
	const [districtId, setDistrictId] = useState<number | undefined>(undefined);
	const [filters, setFilters] = useState<SchoolBoolFilters>({});
	const [showFilters, setShowFilters] = useState(false);
	const [sort, setSort] = useState<SchoolSortKey>("id");
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [limit, setLimit] = useState(50);
	const [offset, setOffset] = useState(0);

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<AdminSchool | null>(null);

	useEffect(() => {
		const t = setTimeout(() => {
			setQ(searchInput.trim());
			setOffset(0);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const { data: districts = [] } = useGetAdminDistrictsQuery();

	const params = useMemo<AdminSchoolsParams>(
		() => ({
			q: q || undefined,
			district_id: districtId,
			...filters,
			limit,
			offset,
			sort,
			order,
		}),
		[q, districtId, filters, limit, offset, sort, order],
	);

	const { data, isFetching, isError } = useGetAdminSchoolsQuery(params);

	useEffect(() => {
		if (data && offset > 0 && offset >= data.total) {
			setOffset(0);
		}
	}, [data, offset]);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const pageStart = total === 0 ? 0 : offset + 1;
	const pageEnd = Math.min(offset + limit, total);
	const activeFilterCount =
		Object.values(filters).filter((v) => v !== undefined).length +
		(districtId !== undefined ? 1 : 0);

	function toggleSort(key: SchoolSortKey) {
		if (sort === key) {
			setOrder((o) => (o === "asc" ? "desc" : "asc"));
		} else {
			setSort(key);
			setOrder("asc");
		}
		setOffset(0);
	}

	function setBoolFilter(key: keyof SchoolBoolFilters, raw: string) {
		setFilters((prev) => {
			const next = { ...prev };
			if (raw === "") delete next[key];
			else next[key] = raw === "true";
			return next;
		});
		setOffset(0);
	}

	function resetFilters() {
		setFilters({});
		setDistrictId(undefined);
		setSearchInput("");
		setQ("");
		setOffset(0);
	}

	function openCreate() {
		setEditing(null);
		setModalOpen(true);
	}

	function openEdit(school: AdminSchool) {
		setEditing(school);
		setModalOpen(true);
	}


	return (
		<div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30">
			<div className="flex flex-col gap-3 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 p-4">
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative min-w-0 flex-1 sm:max-w-xs">
						<svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Поиск по названию, адресу, району, сайту..."
							className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-2 pl-9 pr-3 text-sm text-neutral-800 dark:text-neutral-200 outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
						/>
					</div>

					<button
						onClick={() => setShowFilters((s) => !s)}
						className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-95 ${
							showFilters || activeFilterCount > 0
								? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
								: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
						}`}
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
						</svg>
						Фильтры
						{activeFilterCount > 0 && (
							<span className="ml-0.5 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
								{activeFilterCount}
							</span>
						)}
					</button>

					<button
						onClick={openCreate}
						className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						<span className="hidden sm:inline">Добавить школу</span>
						<span className="sm:hidden">Школа</span>
					</button>
				</div>

				{showFilters && (
					<div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 sm:grid-cols-3 lg:grid-cols-5">
						<div>
							<label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
								Район
							</label>
							<select
								value={districtId ?? ""}
								onChange={(e) => {
									setDistrictId(e.target.value === "" ? undefined : Number(e.target.value));
									setOffset(0);
								}}
								className="w-full rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:border-blue-400"
							>
								<option value="">Все районы</option>
								{[...districts]
									.sort((a, b) => a.name.localeCompare(b.name, "ru"))
									.map((d) => (
										<option key={d.id} value={d.id}>
											{d.name}
										</option>
									))}
							</select>
						</div>
						{BOOL_FILTERS.map(({ key, label }) => (
							<div key={key}>
								<label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
									{label}
								</label>
								<select
									value={filters[key] === undefined ? "" : String(filters[key])}
									onChange={(e) => setBoolFilter(key, e.target.value)}
									className="w-full rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:border-blue-400"
								>
									<option value="">Все</option>
									<option value="true">Да</option>
									<option value="false">Нет</option>
								</select>
							</div>
						))}
						{activeFilterCount > 0 && (
							<div className="col-span-2 flex items-end sm:col-span-1">
								<button
									onClick={resetFilters}
									className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
								>
									Сбросить фильтры
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="relative overflow-x-auto table-scroll">
				{isFetching && (
					<div className="absolute right-3 top-3 z-20 h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 dark:border-neutral-600 border-t-blue-600" />
				)}
				<table className="w-full border-collapse text-[13px]">
					<thead className="sticky top-0 z-10">
						<tr className="bg-[#1e3a5f] text-white">
							<th
								className="w-14 cursor-pointer select-none py-3 pl-5 text-left text-[11px] font-semibold uppercase tracking-wider transition hover:text-blue-200"
								onClick={() => toggleSort("id")}
							>
								#<SortArrow active={sort === "id"} dir={sort === "id" ? order : "asc"} />
							</th>
							<th
								className="min-w-55 cursor-pointer select-none py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider transition hover:text-blue-200"
								onClick={() => toggleSort("name")}
							>
								Название
								<SortArrow active={sort === "name"} dir={sort === "name" ? order : "asc"} />
							</th>
							<th
								className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider transition hover:text-blue-200"
								onClick={() => toggleSort("district")}
							>
								Район
								<SortArrow active={sort === "district"} dir={sort === "district" ? order : "asc"} />
							</th>
							{SORTABLE.map((c) => (
								<th
									key={c.key}
									className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider transition hover:text-blue-200 ${c.align}`}
									onClick={() => toggleSort(c.key)}
								>
									{c.label}
									<SortArrow active={sort === c.key} dir={sort === c.key ? order : "asc"} />
								</th>
							))}
							<th className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider opacity-70">
								Коорд.
							</th>
							<th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider opacity-70">
								Действия
							</th>
						</tr>
					</thead>
					<tbody>
						{items.map((s, i) => (
							<tr
								key={s.id}
								onClick={() => openEdit(s)}
								className={`group cursor-pointer border-b border-neutral-100 dark:border-neutral-700 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
									i % 2 === 0 ? "bg-white dark:bg-neutral-800" : "bg-neutral-50/50 dark:bg-neutral-800/50"
								}`}
							>
								<td className="py-3.5 pl-5 font-medium text-neutral-400 dark:text-neutral-500">
									{s.id}
								</td>
								<td className="py-3.5 pr-4">
									<p className="font-semibold text-neutral-800 dark:text-neutral-200">
										{s.name || <span className="text-neutral-400">— без названия —</span>}
									</p>
									{s.address && (
										<p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400 dark:text-neutral-500">
											{s.address}
										</p>
									)}
									<div className="mt-1 flex flex-wrap gap-1">
										{s.critical_condition && <Tag tone="rose">Аварийное</Tag>}
										{s.needs_repairs && <Tag tone="orange">Ремонт</Tag>}
										{s.form && <Tag tone="blue">Строится</Tag>}
										{s.a_school_with_bias && <Tag tone="rose">Необъект.</Tag>}
									</div>
								</td>
								<td className="whitespace-nowrap px-3 py-3.5 text-neutral-600 dark:text-neutral-400">
									{s.district || "—"}
								</td>
								<td className="px-3 py-3.5 text-center font-medium text-neutral-700 dark:text-neutral-300">
									{fmt(s.students)}
								</td>
								<td className="px-3 py-3.5 text-center font-medium text-neutral-700 dark:text-neutral-300">
									{fmt(s.capacity)}
								</td>
								<td className="px-3 py-3.5 text-center font-medium text-neutral-700 dark:text-neutral-300">
									{fmt(s.workers)}
								</td>
								<td className="px-3 py-3.5 text-center font-medium text-neutral-700 dark:text-neutral-300">
									{fmt(s.teachers)}
								</td>
								<td className="px-3 py-3.5 text-center">
									{s.coords ? (
										<span className="text-emerald-500" title="Координаты есть">●</span>
									) : (
										<span className="text-neutral-300 dark:text-neutral-600" title="Нет координат">○</span>
									)}
								</td>
								<td className="px-3 py-3.5 text-right">
									<button
										onClick={(e) => {
											e.stopPropagation();
											openEdit(s);
										}}
										className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 opacity-0 transition hover:bg-blue-100 group-hover:opacity-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
									>
										<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Изменить
									</button>
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td colSpan={9} className="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
									{isError
										? "Не удалось загрузить список школ"
										: isFetching
											? "Загрузка..."
											: "Школы не найдены"}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 px-4 py-3">
				<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
					<span>
						{pageStart}–{pageEnd} из <strong className="text-neutral-700 dark:text-neutral-300">{total.toLocaleString("ru")}</strong>
					</span>
					<span className="text-neutral-300 dark:text-neutral-600">·</span>
					<label className="flex items-center gap-1">
						На странице:
						<select
							value={limit}
							onChange={(e) => {
								setLimit(Number(e.target.value));
								setOffset(0);
							}}
							className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 text-xs outline-none focus:border-blue-400"
						>
							{PAGE_SIZES.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={() => setOffset(Math.max(0, offset - limit))}
						disabled={offset === 0}
						className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Назад
					</button>
					<button
						onClick={() => setOffset(offset + limit)}
						disabled={pageEnd >= total}
						className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Вперёд
						<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			{modalOpen && (
				<SchoolFormModal
					school={editing}
					districts={districts}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}

function Tag({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone: "rose" | "orange" | "blue";
}) {
	const cls = {
		rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
		orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
		blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	}[tone];
	return (
		<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
			{children}
		</span>
	);
}
