export function StatCell({
	label,
	value,
	accent,
	border,
}: {
	label: string;
	value: string;
	accent: string;
	border?: boolean;
}) {
	return (
		<td
			className={`px-4 py-5 text-center ${border ? "border-l border-neutral-100 dark:border-neutral-700" : ""}`}
		>
			<p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
				{label}
			</p>
			<p
				className="mt-1 text-2xl font-bold tracking-tight"
				style={{ color: accent }}
			>
				{value}
			</p>
		</td>
	);
}
