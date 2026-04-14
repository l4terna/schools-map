import React from "react";
import type { School } from "@/types";
import { fmt } from "@/lib/useDashboardData";

interface Column {
	label: string;
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

function statusClass(value: boolean, tone: "positive" | "negative" | "neutral") {
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
		render: (s) => <td className={TD}>{fmt(s.capacity)}</td>,
	},
	{
		label: "Обучающихся",
		render: (s) => <td className={TD}>{fmt(s.students)}</td>,
	},
	{
		label: "Обуч. во 2 смену",
		render: (s) => <td className={TD}>{fmt(s.second_shift_students)}</td>,
	},
	{
		label: "Работников",
		render: (s) => <td className={TD}>{fmt(s.workers)}</td>,
	},
	{
		label: "Педагогов",
		render: (s) => <td className={TD}>{fmt(s.teachers)}</td>,
	},
	{
		label: "Сайт",
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
		render: (s) => <td className={TD}>{fmt(s.buildings)}</td>,
	},
	{
		label: "Треб. ремонта",
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
		label: "Форма",
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

export function SchoolTable({ schools }: { schools: School[] }) {
	return (
		<table className="w-full border-collapse text-[13px]">
			<thead className="sticky top-0 z-10">
				<tr className="bg-[#1e3a5f] text-white">
					<th className="w-12 py-3 pl-5 text-left text-[11px] font-semibold uppercase tracking-wider opacity-70">
						#
					</th>
					<th className="min-w-55 py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider">
						Название
					</th>
					{COLUMNS.map((col) => (
						<th key={col.label} className={TH}>
							{col.label}
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
							<td className="py-4 pl-5 font-medium text-neutral-400 dark:text-neutral-500">
								{i + 1}
							</td>
							<td className="py-4 pr-4">
								<div className="flex items-center gap-3">
									<span
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
	);
}
