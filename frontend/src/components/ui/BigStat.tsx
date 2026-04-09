export function BigStat({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-700">
			<p
				className="text-2xl font-bold tracking-tight"
				style={{ color: accent }}
			>
				{value}
			</p>
			<p className="mt-1 text-center text-[11px] font-medium leading-tight text-neutral-400 dark:text-neutral-500">
				{label}
			</p>
		</div>
	);
}
