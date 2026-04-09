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
const PLACEHOLDER =
	"py-4 px-3 text-center font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap";

function siteUrl(site: string | null) {
	if (!site) return null;
	return site.startsWith("http") ? site : `https://${site}`;
}

function fillRate(s: School) {
	return (s.capacity ?? 0) > 0 ? ((s.students ?? 0) / s.capacity!) * 100 : 0;
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
		render: () => <td className={PLACEHOLDER}>—</td>,
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
	{ label: "Зданий", render: () => <td className={PLACEHOLDER}>—</td> },
	{ label: "Треб. ремонта", render: () => <td className={PLACEHOLDER}>—</td> },
	{ label: "Аварийное", render: () => <td className={PLACEHOLDER}>—</td> },
	{
		label: "Отремонтирована",
		render: () => <td className={PLACEHOLDER}>—</td>,
	},
	{ label: "Строится", render: () => <td className={PLACEHOLDER}>—</td> },
	{ label: "ШКОН", render: () => <td className={PLACEHOLDER}>—</td> },
	{
		label: "Необъективность",
		render: () => <td className={PLACEHOLDER}>—</td>,
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
