export function FillBar({ value }: { value: number }) {
	const over = value > 100;
	const width = Math.min(value, 100);
	return (
		<div className="flex items-center justify-center gap-2">
			<div className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
				<div
					className={`h-full rounded-full transition-all ${over ? "bg-rose-500" : "bg-emerald-500"}`}
					style={{ width: `${width}%` }}
				/>
			</div>
			<span
				className={`text-xs font-semibold tabular-nums ${over ? "text-rose-600" : "text-emerald-600"}`}
			>
				{value.toFixed(1)}%
			</span>
		</div>
	);
}
