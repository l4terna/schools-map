import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	useGetDistrictsQuery,
	useGetSchoolsByDistrictQuery,
} from "@/store/api/schoolsApi";
import { YandexMap, type YandexMapHandle } from "@/components/YandexMap";
import { Sidebar } from "@/components/Sidebar";
import { DISTRICT_GEO, CHECHNYA_CENTER, CHECHNYA_ZOOM } from "@/data/districts";
import type { School } from "@/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function MapPage() {
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useEffect(() => {
		const goOnline = () => setIsOnline(true);
		const goOffline = () => setIsOnline(false);
		window.addEventListener("online", goOnline);
		window.addEventListener("offline", goOffline);
		return () => {
			window.removeEventListener("online", goOnline);
			window.removeEventListener("offline", goOffline);
		};
	}, []);

	if (!isOnline) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-900 px-4 text-center">
				<svg
					className="h-16 w-16 text-neutral-300 dark:text-neutral-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728m2.828 9.9a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01"
					/>
				</svg>
				<h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
					Нет подключения к интернету
				</h2>
				<p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
					Карта работает только при подключении к сети — для загрузки Yandex
					Maps необходим интернет.
				</p>
				<Link
					to="/"
					className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
				>
					Вернуться на главную
				</Link>
			</div>
		);
	}

	const mapRef = useRef<YandexMapHandle>(null);
	const [searchParams] = useSearchParams();
	const districtParam = searchParams.get("district");
	const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
		districtParam ? Number(districtParam) : null,
	);
	const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

	const { data: districts, isLoading: loadingDistricts } =
		useGetDistrictsQuery();
	const { data: schools, isFetching: loadingSchools } =
		useGetSchoolsByDistrictQuery(selectedDistrictId!, {
			skip: selectedDistrictId === null,
		});

	const selectedDistrict =
		selectedDistrictId !== null
			? (districts?.find((d) => d.id === selectedDistrictId) ?? null)
			: null;
	useEffect(() => {
		if (districtParam && districts) {
			const id = Number(districtParam);
			const district = districts.find((d) => d.id === id);
			if (district) {
				const geo = DISTRICT_GEO[district.name];
				if (geo) mapRef.current?.panTo(geo.center, geo.zoom);
			}
		}
	}, [districtParam, districts]);
	const handleSelectDistrictFromSidebar = useCallback(
		(id: number) => {
			setSelectedDistrictId(id);
			setSelectedSchool(null);

			const district = districts?.find((d) => d.id === id);
			if (district) {
				const geo = DISTRICT_GEO[district.name];
				if (geo) mapRef.current?.panTo(geo.center, geo.zoom, true);
			}
		},
		[districts],
	);

	const handleSelectDistrictFromMap = useCallback(
		(id: number) => {
			setSelectedDistrictId(id);
			setSelectedSchool(null);

			const district = districts?.find((d) => d.id === id);
			if (district) {
				const geo = DISTRICT_GEO[district.name];
				if (geo) mapRef.current?.panTo(geo.center, geo.zoom);
			}
		},
		[districts],
	);

	const handleBack = useCallback(() => {
		setSelectedDistrictId(null);
		setSelectedSchool(null);
		mapRef.current?.panTo(CHECHNYA_CENTER, CHECHNYA_ZOOM, true);
	}, []);

	const handleSelectSchool = useCallback((school: School) => {
		setSelectedSchool(school);
		if (school.coords) {
			mapRef.current?.panTo(school.coords, 15);
		}
	}, []);

	const handleBackToSchools = useCallback(() => {
		setSelectedSchool(null);
		if (selectedDistrict) {
			const geo = DISTRICT_GEO[selectedDistrict.name];
			if (geo) mapRef.current?.panTo(geo.center, geo.zoom, true);
		}
	}, [selectedDistrict]);

	return (
		<div className="relative h-screen bg-neutral-100 dark:bg-neutral-800">
			<div className="absolute right-4 top-4 z-20 flex gap-2">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg dark:shadow-neutral-900/40 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95"
				>
					Главная
				</Link>
				<Link
					to="/admin"
					className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg dark:shadow-neutral-900/40 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95"
				>
					Админ-панель
				</Link>
				<ThemeToggle />
			</div>
			<Sidebar
				districts={districts ?? []}
				selectedDistrict={selectedDistrict}
				schools={schools ?? []}
				selectedSchool={selectedSchool}
				loading={loadingDistricts}
				loadingSchools={loadingSchools}
				onSelectDistrict={handleSelectDistrictFromSidebar}
				onSelectSchool={handleSelectSchool}
				onBack={handleBack}
				onBackToSchools={handleBackToSchools}
			/>

			<YandexMap
				ref={mapRef}
				center={CHECHNYA_CENTER}
				zoom={CHECHNYA_ZOOM}
				schools={selectedDistrictId !== null ? (schools ?? []) : []}
				selectedSchoolName={selectedSchool?.name ?? null}
				onSchoolClick={handleSelectSchool}
				districts={districts ?? []}
				onDistrictClick={handleSelectDistrictFromMap}
				selectedDistrictId={selectedDistrictId}
			/>
		</div>
	);
}
