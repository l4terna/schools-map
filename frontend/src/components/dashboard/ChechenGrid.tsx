import type { DistrictRow } from "@/lib/useDashboardData";

interface ChechenGridProps {
	rows: DistrictRow[];
	onSelect: (id: number) => void;
}

const GROZNY_INNER = new Set([
	"Ахматовский р-н",
	"Висаитовский р-н",
	"Шейх-Мансуровский р-н",
	"Байсангуровский р-н",
]);

/* Короткие названия для квадратиков */
const SHORT: Record<string, string> = {
	"Грозный (город)": "Грозный",
	"Аргун (город)": "Аргун",
	"Итум-Калинский р-н": "Итум-Кали",
	"Веденский р-н": "Ведено",
	"Надтеречный р-н": "Надтеречн.",
	"Серноводский р-н": "Серновод.",
	"Шалинский р-н": "Шали",
	"Шатойский р-н": "Шатой",
	"Шаройский р-н": "Шарой",
	"Грозненский р-н": "Грознен.",
	"Урус-Мартановский р-н": "Урус-Март.",
	"Гудермесский р-н": "Гудермес",
	"Наурский р-н": "Наурский",
	"Ахматовский р-н": "Ахмат.",
	"Курчалоевский р-н": "Курчалой",
	"Висаитовский р-н": "Висаит.",
	"Шейх-Мансуровский р-н": "Ш-Мансур.",
	"Ачхой-Мартановский р-н": "Ачхой-М.",
	"Ножай-Юртовский р-н": "Ножай-Юрт",
	"Шелковской р-н": "Шелковск.",
	"Байсангуровский р-н": "Байсанг.",
};

/*
 * Сетка 6×7 — похожа на карту Чечни.
 * Грозный = 1 ячейка, внутри 4 мини-квадрата.
 */

const COLS = 6;
const ROWS = 6;

type CellDef =
	| { type: "district"; name: string }
	| { type: "grozny" }
	| { type: "empty" };

const GRID: CellDef[][] = [
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Наурский р-н" },
		{ type: "district", name: "Шелковской р-н" },
		{ type: "empty" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "district", name: "Надтеречный р-н" },
		{ type: "district", name: "Грозненский р-н" },
		{ type: "empty" },
		{ type: "empty" },
		{ type: "empty" },
	],
	[
		{ type: "district", name: "Серноводский р-н" },
		{ type: "district", name: "Ачхой-Мартановский р-н" },
		{ type: "grozny" },
		{ type: "district", name: "Аргун (город)" },
		{ type: "district", name: "Гудермесский р-н" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Урус-Мартановский р-н" },
		{ type: "district", name: "Шалинский р-н" },
		{ type: "district", name: "Курчалоевский р-н" },
		{ type: "empty" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Шатойский р-н" },
		{ type: "district", name: "Веденский р-н" },
		{ type: "district", name: "Ножай-Юртовский р-н" },
	],
	[
		{ type: "empty" },
		{ type: "empty" },
		{ type: "district", name: "Итум-Калинский р-н" },
		{ type: "district", name: "Шаройский р-н" },
		{ type: "empty" },
		{ type: "empty" },
	],
];

const GROZNY_INNER_GRID = [
	["Висаитовский р-н", "Ахматовский р-н"],
	["Шейх-Мансуровский р-н", "Байсангуровский р-н"],
];

function findRow(rows: DistrictRow[], name: string) {
	return rows.find((r) => r.district.name === name || r.shortName === name);
}

function hasBias(r: DistrictRow | undefined) {
	return r ? r.schools.some((s) => s.a_school_with_bias) : false;
}

function CellButton({
	row,
	onSelect,
	small,
	label,
}: {
	row: DistrictRow | undefined;
	onSelect: (id: number) => void;
	small?: boolean;
	label?: string;
}) {
	if (!row) return null;
	const bias = hasBias(row);
	const text = label ?? SHORT[row.district.name] ?? row.shortName;
	return (
		<button
			onClick={() => onSelect(row.district.id!)}
			className={`relative flex h-full w-full cursor-pointer transition hover:brightness-110 active:scale-[0.97] ${
				bias ? "bg-rose-500" : "bg-emerald-500"
			} ${small ? "items-center justify-center rounded-[3px] ring-1 ring-black/40" : "items-end justify-start rounded-md"}`}
			title={
				bias
					? `${row.shortName} — есть школа с необъективностью`
					: row.shortName
			}
		>
			<span
				className={`font-bold leading-tight text-white drop-shadow-sm ${
					small ? "text-[5px] sm:text-[6px]" : "p-1.5 text-[8px] sm:text-[10px]"
				}`}
			>
				{text}
			</span>
		</button>
	);
}

export function ChechenGrid({ rows, onSelect }: ChechenGridProps) {
	const groznyMain = findRow(rows, "Грозный (город)");
	const groznyBias =
		hasBias(groznyMain) ||
		[...GROZNY_INNER].some((n) => hasBias(findRow(rows, n)));

	return (
		<div className="flex flex-col gap-2">
			<div
				className="mx-auto grid w-full max-w-[320px] gap-[2px] sm:max-w-[420px] sm:gap-[3px] md:max-w-[520px] lg:max-w-[516px]"
				style={{
					gridTemplateColumns: `repeat(${COLS}, 1fr)`,
					aspectRatio: `${COLS} / ${ROWS}`,
				}}
			>
				{GRID.map((row, ri) =>
					row.map((cell, ci) => {
						const key = `${ri}-${ci}`;

						if (cell.type === "empty") {
							return <div key={key} />;
						}

						if (cell.type === "grozny") {
							return (
								<div
									key={key}
									className={`relative overflow-hidden rounded-md p-[2px] ${
										groznyBias ? "bg-rose-500" : "bg-emerald-500"
									}`}
									title="г. Грозный"
								>
									<button
										onClick={() =>
											groznyMain && onSelect(groznyMain.district.id!)
										}
										className="absolute inset-0 z-10 cursor-pointer transition hover:bg-white/10 active:scale-[0.97]"
									/>
									<span className="pointer-events-none absolute bottom-1 left-1.5 z-20 text-[8px] font-bold text-white/90 drop-shadow-sm sm:text-[10px]">
										Грозный
									</span>
									<div
										className="pointer-events-auto absolute inset-[4px] bottom-auto z-30 grid grid-cols-2 grid-rows-2 gap-[2px]"
										style={{ height: "60%" }}
									>
										{GROZNY_INNER_GRID.flat().map((name) => (
											<CellButton
												key={name}
												row={findRow(rows, name)}
												onSelect={onSelect}
												small
												label={SHORT[name]}
											/>
										))}
									</div>
								</div>
							);
						}

						return (
							<CellButton
								key={key}
								row={findRow(rows, cell.name)}
								onSelect={onSelect}
								label={SHORT[cell.name]}
							/>
						);
					}),
				)}
			</div>
			<div className="mt-2 flex items-center justify-end gap-4 px-1 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
				<span className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
					Есть необъективность
				</span>
				<span className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
					Нет необъективности
				</span>
			</div>
		</div>
	);
}
