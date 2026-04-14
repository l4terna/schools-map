import React, { useState } from "react";
import type { School } from "@/types";
import { fmt } from "@/lib/useDashboardData";
import type { SortState } from "@/lib/useDashboardData";

interface Column {
	label: string;
	sortKey: string;
	render: (s: School, fillRate: number) => React.ReactNode;
}

const TH =
	"py-3 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-white/70 whitespace-nowrap";
const TD =
	"py-4 px-3 text-center font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap";

function siteUrl(site: string | null) {
	if (!site) return null;
	return site.startsWith("http") ? site : `https://${site}`;
}

function fillRate(s: School) {
	return (s.capacity ?? 0) > 0 ? ((s.students ?? 0) / s.capacity!) * 100 : 0;
}

function yesNo(value: boolean) {
	return value ? "Да" : "Нет";
}

function statusClass(
	value: boolean,
	tone: "positive" | "negative" | "neutral",
) {
	if (tone === "positive") {
		return value
			? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
			: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300";
	}

	if (tone === "negative") {
		return value
			? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
			: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
	}

	return value
		? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
		: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300";
}

function StatusTag({
	label,
	value,
	tone = "neutral",
}: {
	label: string;
	value: boolean;
	tone?: "positive" | "negative" | "neutral";
}) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(value, tone)}`}
		>
			{label}: {yesNo(value)}
		</span>
	);
}

const COLUMNS: Column[] = [
	{
		label: "Мощность",
		sortKey: "capacity",
		render: (s) => <td className={TD}>{fmt(s.capacity)}</td>,
	},
	{
		label: "Обучающихся",
		sortKey: "students",
		render: (s) => <td className={TD}>{fmt(s.students)}</td>,
	},
	{
		label: "Обуч. во 2 смену",
		sortKey: "second_shift_students",
		render: (s) => <td className={TD}>{fmt(s.second_shift_students)}</td>,
	},
	{
		label: "Работников",
		sortKey: "workers",
		render: (s) => <td className={TD}>{fmt(s.workers)}</td>,
	},
	{
		label: "Педагогов",
		sortKey: "teachers",
		render: (s) => <td className={TD}>{fmt(s.teachers)}</td>,
	},
	{
		label: "Сайт",
		sortKey: "site",
		render: (s) => {
			const url = siteUrl(s.site);
			return (
				<td className="py-4 px-3 text-center">
					{url ? (
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
						>
							{s.site}
						</a>
					) : (
						<span className="text-neutral-400 dark:text-neutral-500">—</span>
					)}
				</td>
			);
		},
	},
	{
		label: "Зданий",
		sortKey: "buildings",
		render: (s) => <td className={TD}>{fmt(s.buildings)}</td>,
	},
	{
		label: "Треб. ремонта",
		sortKey: "needs_repairs",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.needs_repairs, "negative")}`}
				>
					{yesNo(s.needs_repairs)}
				</span>
			</td>
		),
	},
	{
		label: "Аварийное",
		sortKey: "critical_condition",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.critical_condition, "negative")}`}
				>
					{yesNo(s.critical_condition)}
				</span>
			</td>
		),
	},
	{
		label: "Отремонтирована",
		sortKey: "renovated",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.renovated, "positive")}`}
				>
					{yesNo(s.renovated)}
				</span>
			</td>
		),
	},
	{
		label: "Строится",
		sortKey: "form",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.form, "neutral")}`}
				>
					{yesNo(s.form)}
				</span>
			</td>
		),
	},
	{
		label: "ШКОН",
		sortKey: "shkon",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.shkon, "neutral")}`}
				>
					{yesNo(s.shkon)}
				</span>
			</td>
		),
	},
	{
		label: "С уклоном",
		sortKey: "a_school_with_bias",
		render: (s) => (
			<td className="py-4 px-3 text-center whitespace-nowrap">
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(s.a_school_with_bias, "neutral")}`}
				>
					{yesNo(s.a_school_with_bias)}
				</span>
			</td>
		),
	},
];

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

interface SchoolTableProps {
	schools: School[];
	sort: SortState<string>;
	onToggleSort: (key: string) => void;
}

function MobileSchoolCards({ schools }: { schools: School[] }) {
	const [openIdx, setOpenIdx] = useState<number | null>(null);

	return (
		<div className="divide-y divide-neutral-100 dark:divide-neutral-700 md:hidden">
			{schools.map((s, i) => {
				const fr = fillRate(s);
				const isOpen = openIdx === i;
				return (
					<div
						key={i}
						className={
							i % 2 === 0
								? "bg-white dark:bg-neutral-800"
								: "bg-neutral-50/50 dark:bg-neutral-800/50"
						}
					>
						<button
							onClick={() => setOpenIdx(isOpen ? null : i)}
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
											fr < 100
												? `Заполненность ниже 100% (${fr.toFixed(0)}%)`
												: `Заполненность ${fr.toFixed(0)}%`
										}
										className={`h-2 w-2 shrink-0 rounded-full ${fr < 100 ? "bg-rose-500" : "bg-emerald-500"}`}
									/>
									<p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
										{s.name}
									</p>
								</div>
								<p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
									{fmt(s.students)} уч. / {fmt(s.capacity)} мест ·{" "}
									{fr.toFixed(0)}%
								</p>
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
											{fmt(s.capacity)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Мощность
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.students)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Обуч-ся
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.second_shift_students)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Во 2 смену
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.workers)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Работников
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.teachers)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Педагогов
										</p>
									</div>
									<div className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-2 py-2">
										<p className="font-bold text-neutral-800 dark:text-neutral-200">
											{fmt(s.buildings)}
										</p>
										<p className="text-neutral-400 dark:text-neutral-500">
											Зданий
										</p>
									</div>
								</div>
								<div className="mt-2 flex flex-wrap gap-1.5">
									<StatusTag label="Гос." value={s.is_state} tone="positive" />
									<StatusTag
										label="Ремонт"
										value={s.needs_repairs}
										tone="negative"
									/>
									<StatusTag
										label="Аварийное"
										value={s.critical_condition}
										tone="negative"
									/>
									<StatusTag
										label="Отрем."
										value={s.renovated}
										tone="positive"
									/>
									<StatusTag label="Строится" value={s.form} tone="neutral" />
									<StatusTag label="ШКОН" value={s.shkon} tone="neutral" />
									<StatusTag
										label="Необъект."
										value={s.a_school_with_bias}
										tone="neutral"
									/>
								</div>
								{s.address && (
									<p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
										{s.address}
									</p>
								)}
								{s.site && (
									<a
										href={siteUrl(s.site)!}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-1 block text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
									>
										{s.site}
									</a>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function SchoolTable({ schools, sort, onToggleSort }: SchoolTableProps) {
	return (
		<>
			<MobileSchoolCards schools={schools} />
			<table className="hidden w-full border-collapse text-[13px] md:table">
				<thead className="sticky top-0 z-10">
					<tr className="bg-[#1e3a5f] text-white">
						<th className="w-12 py-3 pl-5 text-left text-[11px] font-semibold uppercase tracking-wider opacity-70">
							#
						</th>
						<th
							className="min-w-55 py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-blue-200 transition"
							onClick={() => onToggleSort("name")}
						>
							Название
							<SortArrow
								active={sort.key === "name"}
								dir={sort.key === "name" ? sort.dir : "asc"}
							/>
						</th>
						{COLUMNS.map((col) => (
							<th
								key={col.label}
								className={`${TH} cursor-pointer select-none hover:text-blue-200 transition`}
								onClick={() => onToggleSort(col.sortKey)}
							>
								{col.label}
								<SortArrow
									active={sort.key === col.sortKey}
									dir={sort.key === col.sortKey ? sort.dir : "asc"}
								/>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{schools.map((s, i) => {
						const fr = fillRate(s);
						return (
							<tr
								key={i}
								className={`border-b border-neutral-100 dark:border-neutral-700 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${i % 2 === 0 ? "bg-white dark:bg-neutral-800" : "bg-neutral-50/50 dark:bg-neutral-800/50"}`}
							>
								<td className="py-4 pl-5 pr-3 font-medium text-neutral-400 dark:text-neutral-500">
									{i + 1}
								</td>
								<td className="py-4 pl-2 pr-4">
									<div className="flex items-center gap-3">
										<span
											title={
												fr < 100
													? `Заполненность ниже 100% (${fr.toFixed(0)}%)`
													: `Заполненность ${fr.toFixed(0)}%`
											}
											className={`h-2.5 w-2.5 shrink-0 rounded-full ${fr < 100 ? "bg-rose-500" : "bg-emerald-500"}`}
										/>
										<div className="min-w-0">
											<p className="font-semibold text-neutral-800 dark:text-neutral-200">
												{s.name}
											</p>
											<div className="mt-1 flex flex-wrap gap-1.5">
												<StatusTag
													label="Гос."
													value={s.is_state}
													tone="positive"
												/>
												<StatusTag
													label="Религ."
													value={s.is_religional}
													tone="positive"
												/>
												<StatusTag
													label="Уклон"
													value={s.a_school_with_bias}
													tone="neutral"
												/>
											</div>
											{s.address && (
												<p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
													{s.address}
												</p>
											)}
										</div>
									</div>
								</td>
								{COLUMNS.map((col) => (
									<React.Fragment key={col.label}>
										{col.render(s, fr)}
									</React.Fragment>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	);
}
