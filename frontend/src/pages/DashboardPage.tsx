import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardData, schoolWord } from "@/lib/useDashboardData";
import { FillBar } from "@/components/ui/FillBar";
import { BigStat } from "@/components/ui/BigStat";
import { StatCell } from "@/components/ui/StatCell";
import { TabBtn } from "@/components/ui/TabBtn";
import { SchoolTable } from "@/components/dashboard/SchoolTable";
import { ChechenGrid } from "@/components/dashboard/ChechenGrid";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
	return (
		<svg
			className={`ml-1 inline h-3 w-3 transition ${active ? "opacity-100" : "opacity-30"}`}
			viewBox="0 0 10 12"
			fill="currentColor"
		>
			{dir === "asc" || !active ? (
				<path d="M5 0L10 6H0z" />
			) : (
				<path d="M5 12L0 6h10z" />
			)}
		</svg>
	);
}

export function DashboardPage() {
	const {
		isLoading,
		showOffline,
		noData,
		rows,
		sorted,
		totals,
		selected,
		sortedSchools,
		setSelectedId,
		districtQuery,
		setDistrictQuery,
		schoolQuery,
		setSchoolQuery,
		districtSort,
		toggleDistrictSort,
		schoolSort,
		toggleSchoolSort,
	} = useDashboardData();
	const [expanded, setExpanded] = useState(false);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);
	const [tab, setTab] = useState<"districts" | "republic">("districts");

	if (noData) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-900 px-4 text-center">
				<svg
					className="h-16 w-16 text-neutral-300 dark:text-neutral-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
					Не удалось загрузить данные
				</h2>
				<p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
					Проверьте подключение к интернету и попробуйте снова.
				</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
				>
					Повторить
				</button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-blue-600" />
			</div>
		);
	}

	const offlineBanner = showOffline ? (
		<div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
			<svg
				className="h-4 w-4 shrink-0"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728"
				/>
			</svg>
			Нет подключения — данные из кэша
		</div>
	) : null;

	if (selected) {
		return (
			<div className="flex flex-col bg-neutral-50 dark:bg-neutral-900 lg:h-screen">
				{offlineBanner}
				<div className="mx-auto flex min-h-0 w-full max-w-screen-sm flex-1 flex-col lg:mx-0 lg:max-w-none lg:flex-row">
					<div className="flex min-w-0 flex-col p-4 lg:min-h-0 lg:flex-1 lg:p-6">
						<div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
							<button
								onClick={() => setSelectedId(null)}
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								<span className="hidden sm:inline">Все районы</span>
								<span className="sm:hidden">Назад</span>
							</button>
							<div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
							<h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
								{selected.shortName}
							</h2>
						</div>

						<div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 lg:h-auto lg:min-h-0 lg:flex-1">
							<div className="flex shrink-0 flex-col gap-2 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
								<div className="flex items-center gap-3">
									<h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
										Показатели по школам
									</h3>
									<input
										type="text"
										value={schoolQuery}
										onChange={(e) => setSchoolQuery(e.target.value)}
										placeholder="Поиск школы..."
										className="w-36 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1 text-xs text-neutral-800 dark:text-neutral-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 dark:focus:ring-blue-500/30 sm:w-44"
									/>
								</div>
								<span className="text-xs text-neutral-400 dark:text-neutral-500">
									{sortedSchools.length} {schoolWord(sortedSchools.length)}
								</span>
							</div>
							<div className="flex-1 overflow-auto table-scroll">
								<SchoolTable
									schools={sortedSchools}
									sort={schoolSort}
									onToggleSort={toggleSchoolSort}
								/>
							</div>
						</div>
					</div>

					<div className="flex w-full shrink-0 flex-col gap-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 lg:h-full lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-6">
						<h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
							{selected.shortName}
						</h3>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
							<div className="col-span-2 sm:col-span-1">
								<BigStat
									label="Уровень заполненности школ"
									value={`${selected.fillRate.toFixed(1)}%`}
									accent={selected.fillRate > 100 ? "#ef4444" : "#10b981"}
								/>
							</div>
							<div className="col-span-2 grid grid-cols-2 gap-3">
								<BigStat
									label="Обучающихся"
									value={(selected.district.students ?? 0).toLocaleString("ru")}
									accent="#3b82f6"
								/>
								<BigStat
									label="Мощность"
									value={selected.totalCapacity.toLocaleString("ru")}
									accent="#8b5cf6"
								/>
							</div>
							<div className="col-span-2 grid grid-cols-2 gap-3">
								<BigStat
									label="Педагогов"
									value={(selected.district.teachers ?? 0).toLocaleString("ru")}
									accent="#f59e0b"
								/>
								<BigStat
									label="Работников"
									value={(selected.district.workers ?? 0).toLocaleString("ru")}
									accent="#3b82f6"
								/>
							</div>
							<div className="col-span-2 grid grid-cols-2 gap-3">
								<BigStat
									label="Школ"
									value={String(selected.schoolCount)}
									accent="#10b981"
								/>
								<BigStat
									label="Потребность"
									value={Math.max(
										0,
										(selected.district.students ?? 0) - selected.totalCapacity,
									).toLocaleString("ru")}
									accent="#ef4444"
								/>
							</div>
						</div>
						<div className="mt-2 hidden lg:block">
							<Link
								to={`/map?district=${selected.district.id}`}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.97]"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
									/>
								</svg>
								Показать на карте
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col bg-neutral-50 dark:bg-neutral-900 lg:h-screen">
			{offlineBanner}
			{/* Mobile top nav */}
			<div className="mx-auto flex w-full max-w-screen-sm items-center gap-2 px-4 pt-4 md:hidden lg:mx-0 lg:max-w-none">
				<Link
					to="/map"
					className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:inline-flex"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					Карта
				</Link>
				<Link
					to="/admin"
					className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Админ-панель
				</Link>
				<ThemeToggle />
			</div>
			<div className="mx-auto flex min-w-0 w-full max-w-screen-sm flex-1 flex-col md:max-w-none lg:mx-0 lg:min-h-0 lg:flex-row lg:overflow-hidden">
				<div
					className={`flex min-w-0 flex-col p-4 lg:min-h-0 lg:p-6 ${expanded ? "lg:flex-1" : "lg:flex-1 lg:w-1/2 xl:w-[62%] lg:shrink-0"}`}
				>
					<div className="flex h-[70vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 lg:h-auto lg:min-h-0 lg:flex-1">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/60 px-4 py-2.5 sm:px-5">
							<div className="flex items-center gap-2 sm:gap-3">
								<h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
									Рейтинг районов
								</h2>
								<input
									type="text"
									value={districtQuery}
									onChange={(e) => setDistrictQuery(e.target.value)}
									placeholder="Поиск района..."
									className="w-32 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1 text-xs text-neutral-800 dark:text-neutral-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 dark:focus:ring-blue-500/30 sm:w-40"
								/>
							</div>
							<button
								onClick={() => setExpanded((e) => !e)}
								className="hidden cursor-pointer items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#264d73] active:scale-95 md:inline-flex"
								title={expanded ? "Свернуть таблицу" : "Развернуть таблицу"}
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{expanded ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
										/>
									)}
								</svg>
								{expanded ? "Свернуть" : "Развернуть"}
							</button>
						</div>
						{/* Mobile: expandable card list */}
						<div className="flex-1 overflow-auto table-scroll md:hidden">
							<div className="divide-y divide-neutral-100 dark:divide-neutral-700">
								{sorted.map((r, i) => {
									const students = r.district.students ?? 0;
									const workers = r.district.workers ?? 0;
									const isOpen = expandedCard === r.district.id;
									return (
										<div
											key={`${r.district.id}-${r.district.name}`}
											className={
												i % 2 === 0
													? "bg-white dark:bg-neutral-800"
													: "bg-neutral-50/50 dark:bg-neutral-800/50"
											}
										>
											<button
												onClick={() =>
													setExpandedCard(isOpen ? null : r.district.id!)
												}
												className="flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition active:bg-blue-50 dark:active:bg-blue-900/30"
											>
												<div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
													<span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
														{i + 1}
													</span>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-1.5">
														<span
															title={
																r.schools.some((s) => s.a_school_with_bias)
																	? "Есть школа с необъективностью"
																	: "Нет школ с необъективностью"
															}
															className={`h-2 w-2 shrink-0 rounded-full ${r.schools.some((s) => s.a_school_with_bias) ? "bg-rose-500" : "bg-emerald-500"}`}
														/>
														<p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
															{r.shortName}
														</p>
													</div>
													<div className="mt-1.5">
														<FillBar value={r.fillRate} />
													</div>
												</div>
												<svg
													className={`mt-1 h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600 transition-transform ${isOpen ? "rotate-90" : ""}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</button>
											{isOpen && (
												<div className="px-4 pb-3">
													<div className="grid grid-cols-3 gap-2 text-center text-[11px]">
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.schoolCount}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Школ
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.totalCapacity.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Мощность
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{students.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Обуч-ся
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.secondShiftStudents.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Во 2 смену
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{workers.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Работников
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.buildings.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Зданий
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p
																className={`font-bold ${r.repairBuildingsRate > 0 ? "text-orange-500 dark:text-orange-400" : "text-neutral-800 dark:text-neutral-200"}`}
															>
																{`${r.repairBuildings} (${r.repairBuildingsRate.toFixed(1)}%)`}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Треб. ремонта
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p
																className={`font-bold ${r.criticalBuildingsRate > 0 ? "text-orange-500 dark:text-orange-400" : "text-neutral-800 dark:text-neutral-200"}`}
															>
																{`${r.criticalBuildings} (${r.criticalBuildingsRate.toFixed(1)}%)`}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Аварийное
															</p>
														</div>
														<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
															<p className="font-bold text-neutral-800 dark:text-neutral-200">
																{r.formSchools.toLocaleString("ru")}
															</p>
															<p className="text-neutral-400 dark:text-neutral-500">
																Строящиеся
															</p>
														</div>
													</div>
													{students > r.totalCapacity && (
														<p className="mt-2 text-center text-xs font-semibold text-rose-500">
															Дефицит:{" "}
															{(students - r.totalCapacity).toLocaleString(
																"ru",
															)}{" "}
															мест
														</p>
													)}
													<button
														onClick={() => setSelectedId(r.district.id!)}
														className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 active:scale-[0.97]"
													>
														Подробнее по школам
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
						{/* Desktop: full table */}
						<div className="hidden flex-1 overflow-auto table-scroll md:block">
							<table className="w-full border-collapse text-[13px]">
								<thead className="sticky top-0 z-10">
									<tr className="bg-[#1e3a5f] text-white">
										<th className="w-12 py-3 pl-5 text-left text-[11px] font-semibold uppercase tracking-wider opacity-70">
											#
										</th>
										<th
											className="min-w-50 py-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("name")}
										>
											Район
											<SortArrow
												active={districtSort.key === "name"}
												dir={
													districtSort.key === "name" ? districtSort.dir : "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("fillRate")}
										>
											Уровень заполненности школ
											<SortArrow
												active={districtSort.key === "fillRate"}
												dir={
													districtSort.key === "fillRate"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() => toggleDistrictSort("repairBuildingsRate")}
										>
											Зданий требуют кап. ремонта
											<SortArrow
												active={districtSort.key === "repairBuildingsRate"}
												dir={
													districtSort.key === "repairBuildingsRate"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										<th
											className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
											onClick={() =>
												toggleDistrictSort("criticalBuildingsRate")
											}
										>
											Зданий в аварийном состоянии
											<SortArrow
												active={districtSort.key === "criticalBuildingsRate"}
												dir={
													districtSort.key === "criticalBuildingsRate"
														? districtSort.dir
														: "asc"
												}
											/>
										</th>
										{expanded && (
											<>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("schoolCount")}
												>
													Школ
													<SortArrow
														active={districtSort.key === "schoolCount"}
														dir={
															districtSort.key === "schoolCount"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("totalCapacity")}
												>
													Мощность
													<SortArrow
														active={districtSort.key === "totalCapacity"}
														dir={
															districtSort.key === "totalCapacity"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("students")}
												>
													Обучающихся
													<SortArrow
														active={districtSort.key === "students"}
														dir={
															districtSort.key === "students"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() =>
														toggleDistrictSort("secondShiftStudents")
													}
												>
													Обуч. во 2 смену
													<SortArrow
														active={districtSort.key === "secondShiftStudents"}
														dir={
															districtSort.key === "secondShiftStudents"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("repairSchools")}
												>
													Школы, треб. ремонта
													<SortArrow
														active={districtSort.key === "repairSchools"}
														dir={
															districtSort.key === "repairSchools"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("repairCapacity")}
												>
													Места в таких
													<SortArrow
														active={districtSort.key === "repairCapacity"}
														dir={
															districtSort.key === "repairCapacity"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("formSchools")}
												>
													Строящиеся школы
													<SortArrow
														active={districtSort.key === "formSchools"}
														dir={
															districtSort.key === "formSchools"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("formCapacity")}
												>
													Места в строящихся
													<SortArrow
														active={districtSort.key === "formCapacity"}
														dir={
															districtSort.key === "formCapacity"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("workers")}
												>
													Работников
													<SortArrow
														active={districtSort.key === "workers"}
														dir={
															districtSort.key === "workers"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
												<th
													className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
													onClick={() => toggleDistrictSort("buildings")}
												>
													Зданий
													<SortArrow
														active={districtSort.key === "buildings"}
														dir={
															districtSort.key === "buildings"
																? districtSort.dir
																: "asc"
														}
													/>
												</th>
											</>
										)}
									</tr>
								</thead>
								<tbody>
									{sorted.map((r, i) => (
										<tr
											key={`${r.district.id}-${r.district.name}`}
											onClick={() => setSelectedId(r.district.id!)}
											className={`group cursor-pointer border-b border-neutral-100 dark:border-neutral-700 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${i % 2 === 0 ? "bg-white dark:bg-neutral-800" : "bg-neutral-50/50 dark:bg-neutral-800/50"}`}
										>
											<td className="py-4 pl-5 font-medium text-neutral-400 dark:text-neutral-500">
												{i + 1}
											</td>
											<td className="py-4 pr-6">
												<div className="flex items-center gap-3">
													<span
														title={
															r.schools.some((s) => s.a_school_with_bias)
																? "Есть школа с необъективностью"
																: "Нет школ с необъективностью"
														}
														className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.schools.some((s) => s.a_school_with_bias) ? "bg-rose-500" : "bg-emerald-500"}`}
													/>
													<span className="font-semibold text-neutral-800 dark:text-neutral-200">
														{r.shortName}
													</span>
												</div>
											</td>
											<td className="py-4 px-4 text-center">
												<FillBar value={r.fillRate} />
											</td>
											<td
												className={`py-4 px-4 text-center font-medium ${r.repairBuildingsRate > 0 ? "text-orange-500 dark:text-orange-400" : "text-neutral-700 dark:text-neutral-300"}`}
											>
												{r.repairBuildingsRate.toFixed(1)}%
											</td>
											<td
												className={`py-4 px-4 text-center font-medium ${r.criticalBuildingsRate > 0 ? "text-orange-500 dark:text-orange-400" : "text-neutral-700 dark:text-neutral-300"}`}
											>
												{r.criticalBuildingsRate.toFixed(1)}%
											</td>
											{expanded && (
												<>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.schoolCount}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.totalCapacity.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{(r.district.students ?? 0).toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.secondShiftStudents.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.repairSchools.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.repairCapacity.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.formSchools.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.formCapacity.toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{(r.district.workers ?? 0).toLocaleString("ru")}
													</td>
													<td className="py-4 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
														{r.buildings.toLocaleString("ru")}
													</td>
												</>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{!expanded && (
					<div className="flex w-full flex-col gap-5 p-4 lg:w-1/2 xl:w-[38%] lg:overflow-y-auto lg:p-6 lg:pl-0">
						<div className="hidden items-center gap-2 md:flex">
							<Link
								to="/map"
								className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-[0.97]"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
									/>
								</svg>
								Карта школ
							</Link>
							<Link
								to="/admin"
								className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-[0.97]"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								Админ-панель
							</Link>
							<ThemeToggle />
						</div>

						<div className="flex gap-1 rounded-2xl bg-neutral-200/60 dark:bg-neutral-700/60 p-1">
							<TabBtn
								active={tab === "districts"}
								onClick={() => setTab("districts")}
							>
								Районы
							</TabBtn>
							<TabBtn
								active={tab === "republic"}
								onClick={() => setTab("republic")}
							>
								Республика
							</TabBtn>
						</div>

						{tab === "republic" ? (
							<div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30">
								{/* Desktop: table layout */}
								<table className="hidden w-full border-collapse sm:table">
									<tbody>
										<tr className="border-b border-neutral-100 dark:border-neutral-700">
											<StatCell
												label="Уровень заполненности школ"
												value={`${totals.fillRate.toFixed(1)}%`}
												accent={totals.fillRate > 100 ? "#ef4444" : "#10b981"}
											/>
											<StatCell
												label="Требует кап. ремонта"
												value={`${totals.repairBuildingsRate.toFixed(1)}%`}
												accent={
													totals.repairBuildings > 0 ? "#f97316" : "#a3a3a3"
												}
												border
											/>
											<StatCell
												label="В аварийном состоянии"
												value={`${totals.criticalBuildingsRate.toFixed(1)}%`}
												accent={
													totals.criticalBuildings > 0 ? "#f97316" : "#a3a3a3"
												}
												border
											/>
										</tr>
										<tr className="border-b border-neutral-100 dark:border-neutral-700">
											<StatCell
												label="Количество обучающихся"
												value={totals.students.toLocaleString("ru")}
												accent="#f59e0b"
											/>
											<StatCell
												label="Обучающихся во 2 смену"
												value={totals.secondShiftStudents.toLocaleString("ru")}
												accent="#8b5cf6"
												border
											/>
											<StatCell
												label="Мест в школах"
												value={totals.capacity.toLocaleString("ru")}
												accent="#3b82f6"
												border
											/>
										</tr>
										<tr>
											<StatCell
												label="Потребность в местах"
												value={totals.demand.toLocaleString("ru")}
												accent={totals.demand > 0 ? "#ef4444" : "#10b981"}
											/>
											<StatCell
												label="Мест в строящихся школах"
												value={totals.formCapacity.toLocaleString("ru")}
												accent="#8b5cf6"
												border
											/>
											<StatCell
												label="Мест в ремонтируемых школах"
												value={totals.repairCapacity.toLocaleString("ru")}
												accent="#ef4444"
												border
											/>
										</tr>
									</tbody>
								</table>
								{/* Mobile: grid layout */}
								<div className="grid grid-cols-2 gap-2 sm:hidden">
									<BigStat
										label="Заполненность школ"
										value={`${totals.fillRate.toFixed(1)}%`}
										accent={totals.fillRate > 100 ? "#ef4444" : "#10b981"}
									/>
									<BigStat
										label="Обучающихся"
										value={totals.students.toLocaleString("ru")}
										accent="#f59e0b"
									/>
									<BigStat
										label="Мест в школах"
										value={totals.capacity.toLocaleString("ru")}
										accent="#3b82f6"
									/>
									<BigStat
										label="Потребность в местах"
										value={totals.demand.toLocaleString("ru")}
										accent={totals.demand > 0 ? "#ef4444" : "#10b981"}
									/>
									<BigStat
										label="Треб. кап. ремонта"
										value={`${totals.repairBuildingsRate.toFixed(1)}%`}
										accent={totals.repairBuildings > 0 ? "#f97316" : "#a3a3a3"}
									/>
									<BigStat
										label="Аварийное состояние"
										value={`${totals.criticalBuildingsRate.toFixed(1)}%`}
										accent={
											totals.criticalBuildings > 0 ? "#f97316" : "#a3a3a3"
										}
									/>
								</div>
							</div>
						) : (
							<ChechenGrid rows={rows} onSelect={(id) => setSelectedId(id)} />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
