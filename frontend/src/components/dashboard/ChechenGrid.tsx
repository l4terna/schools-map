import type { DistrictRow } from "@/lib/useDashboardData";

interface ChechenGridProps {
	rows: DistrictRow[];
	onSelect: (id: number) => void;
}

export function ChechenGrid({ rows, onSelect }: ChechenGridProps) {
	return (
		<div className="flex flex-wrap gap-px overflow-hidden">
			{rows.map((r) => (
				<button
					key={`${r.district.id}-${r.district.name}`}
					onClick={() => onSelect(r.district.id!)}
					className="flex cursor-pointer items-center justify-center rounded-sm bg-emerald-500 p-2.5 text-center transition hover:brightness-110 active:scale-95 sm:p-3"
					title={r.shortName}
				>
					<span className="text-[10px] font-bold leading-tight text-white sm:text-xs">
						{r.shortName}
					</span>
				</button>
			))}
		</div>
	);
}
