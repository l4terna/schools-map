import { useGetAdminStatsQuery } from "@/store/api/schoolsApi";
import type { AdminStats as AdminStatsData } from "@/types";

interface StatDef {
	key: keyof AdminStatsData;
	label: string;
	accent: string;
	icon: React.ReactNode;
}

const ICON = "h-5 w-5";

const STATS: StatDef[] = [
	{
		key: "districts",
		label: "Районов",
		accent: "#3b82f6",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
			</svg>
		),
	},
	{
		key: "schools",
		label: "Школ",
		accent: "#10b981",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z" />
			</svg>
		),
	},
	{
		key: "students",
		label: "Обучающихся",
		accent: "#f59e0b",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-3-3" />
			</svg>
		),
	},
	{
		key: "without_coords",
		label: "Без координат",
		accent: "#8b5cf6",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 9l6 6m0-6l-6 6" />
			</svg>
		),
	},
	{
		key: "needs_repairs",
		label: "Требуют ремонта",
		accent: "#f97316",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
			</svg>
		),
	},
	{
		key: "critical_condition",
		label: "Аварийные",
		accent: "#ef4444",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
			</svg>
		),
	},
	{
		key: "renovated",
		label: "Отремонтированы",
		accent: "#10b981",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
	},
	{
		key: "a_school_with_bias",
		label: "С необъективностью",
		accent: "#e11d48",
		icon: (
			<svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l9-3 9 3M3 6v12l9 3 9-3V6M3 6l9 3m0 0l9-3m-9 3v12" />
			</svg>
		),
	},
];

function StatCard({
	label,
	value,
	accent,
	icon,
	loading,
}: {
	label: string;
	value: number;
	accent: string;
	icon: React.ReactNode;
	loading: boolean;
}) {
	return (
		<div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-800 p-3.5 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700 sm:p-4">
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
				style={{ backgroundColor: `${accent}1a`, color: accent }}
			>
				{icon}
			</div>
			<div className="min-w-0">
				<p
					className="text-xl font-bold leading-tight tracking-tight tabular-nums sm:text-2xl"
					style={{ color: accent }}
				>
					{loading ? "—" : value.toLocaleString("ru")}
				</p>
				<p className="truncate text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
					{label}
				</p>
			</div>
		</div>
	);
}

export function AdminStats() {
	const { data, isLoading } = useGetAdminStatsQuery();

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{STATS.map((s) => (
				<StatCard
					key={s.key}
					label={s.label}
					value={data?.[s.key] ?? 0}
					accent={s.accent}
					icon={s.icon}
					loading={isLoading}
				/>
			))}
		</div>
	);
}
