import { useEffect, useRef, useState } from "react";
import { loadYmaps } from "@/lib/ymaps";
import { CHECHNYA_CENTER, CHECHNYA_ZOOM } from "@/data/districts";
import republicBorderJSON from "@/data/republic-border.geojson?raw";

interface Props {
	lat: number | null;
	lng: number | null;
	onChange: (lat: number, lng: number) => void;
	onClear: () => void;
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

function flipRing(ring: number[][]): number[][] {
	return ring.map((p) => [p[1]!, p[0]!]);
}

/** Затемняет всё вне границ Чечни и рисует белый контур — как на главной карте. */
function drawRepublicMask(ymaps: any, map: any) {
	try {
		const geom = JSON.parse(republicBorderJSON);
		const chechnyaRing = flipRing(geom.coordinates[0]);

		const outer: number[][] = [
			[70, 20],
			[70, 70],
			[20, 70],
			[20, 20],
			[70, 20],
		];
		const hole = [...chechnyaRing].reverse();

		const mask = new ymaps.Polygon(
			[outer, hole],
			{},
			{ fillColor: "00000060", strokeWidth: 0 },
		);
		mask.options.set("interactivityModel", "default#transparent");
		map.geoObjects.add(mask);

		const border = new ymaps.Polygon(
			[chechnyaRing],
			{},
			{
				fillColor: "00000000",
				strokeColor: "#ffffffcc",
				strokeWidth: 4,
				strokeStyle: "solid",
			},
		);
		border.options.set("interactivityModel", "default#transparent");
		map.geoObjects.add(border);
	} catch (e) {
		console.warn("Could not render republic border:", e);
	}
}

export function CoordPicker({ lat, lng, onChange, onClear }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<any>(null);
	const ymapsRef = useRef<any>(null);
	const placemarkRef = useRef<any>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

	// Изначальные координаты — фиксируем на момент монтирования (модалка пересоздаётся при каждом открытии).
	const initialRef = useRef<{ lat: number | null; lng: number | null }>({
		lat,
		lng,
	});

	function placePoint(la: number, lo: number) {
		const ymaps = ymapsRef.current;
		const map = mapRef.current;
		if (!ymaps || !map) return;

		if (!placemarkRef.current) {
			placemarkRef.current = new ymaps.Placemark(
				[la, lo],
				{ hintContent: "Перетащите, чтобы уточнить" },
				{ draggable: true, preset: "islands#redEducationIcon" },
			);
			placemarkRef.current.events.add("dragend", () => {
				const c = placemarkRef.current.geometry.getCoordinates();
				onChangeRef.current(round(c[0]), round(c[1]));
			});
			map.geoObjects.add(placemarkRef.current);
		} else {
			placemarkRef.current.geometry.setCoordinates([la, lo]);
		}
	}

	function removePoint() {
		if (placemarkRef.current && mapRef.current) {
			mapRef.current.geoObjects.remove(placemarkRef.current);
		}
		placemarkRef.current = null;
	}

	// Инициализация карты — один раз.
	useEffect(() => {
		let destroyed = false;

		loadYmaps()
			.then((ymaps) => {
				if (destroyed || !containerRef.current) return;
				ymapsRef.current = ymaps;

				const { lat: la, lng: lo } = initialRef.current;
				const hasPoint = la != null && lo != null;

				const map = new ymaps.Map(
					containerRef.current,
					{
						center: hasPoint ? [la, lo] : CHECHNYA_CENTER,
						zoom: hasPoint ? 15 : CHECHNYA_ZOOM,
						controls: ["zoomControl", "geolocationControl"],
					},
					{ suppressMapOpenBlock: true },
				);
				mapRef.current = map;
				map.container.fitToViewport();

				drawRepublicMask(ymaps, map);

				if (hasPoint) placePoint(la!, lo!);

				map.events.add("click", (e: any) => {
					const coords = e.get("coords");
					const la2 = round(coords[0]);
					const lo2 = round(coords[1]);
					placePoint(la2, lo2);
					onChangeRef.current(la2, lo2);
				});

				setStatus("ready");
			})
			.catch(() => setStatus("error"));

		return () => {
			destroyed = true;
			mapRef.current?.destroy();
			mapRef.current = null;
			placemarkRef.current = null;
		};
	}, []);

	// Синхронизация метки с внешними значениями (ручной ввод в полях).
	useEffect(() => {
		if (status !== "ready") return;
		if (lat == null || lng == null) {
			removePoint();
			return;
		}
		placePoint(lat, lng);
	}, [lat, lng, status]);

	function centerOnPoint() {
		if (lat == null || lng == null || !mapRef.current) return;
		const z = Math.max(mapRef.current.getZoom(), 15);
		mapRef.current.setCenter([lat, lng], z, { duration: 400 });
	}

	const hasPoint = lat != null && lng != null;

	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between">
				<label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
					Координаты на карте
				</label>
				<div className="flex items-center gap-2">
					{hasPoint && (
						<button
							type="button"
							onClick={centerOnPoint}
							className="text-xs font-medium text-blue-600 transition hover:underline dark:text-blue-400"
						>
							К метке
						</button>
					)}
					{hasPoint && (
						<button
							type="button"
							onClick={onClear}
							className="text-xs font-medium text-neutral-400 transition hover:text-red-500 dark:text-neutral-500"
						>
							Очистить
						</button>
					)}
				</div>
			</div>

			<div className="relative h-56 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 sm:h-64">
				<div ref={containerRef} className="h-full w-full" />

				{status === "loading" && (
					<div className="absolute inset-0 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
						<div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-blue-600" />
					</div>
				)}

				{status === "error" && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-50 px-4 text-center dark:bg-neutral-900">
						<svg className="h-7 w-7 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
						</svg>
						<p className="text-xs text-neutral-500 dark:text-neutral-400">
							Карта недоступна — введите координаты вручную
						</p>
					</div>
				)}

				{status === "ready" && (
					<div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-center text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur dark:bg-neutral-800/90 dark:text-neutral-300">
						{hasPoint
							? `${lat!.toFixed(6)}, ${lng!.toFixed(6)} — кликните или перетащите метку`
							: "Кликните по карте, чтобы поставить метку"}
					</div>
				)}
			</div>
		</div>
	);
}
