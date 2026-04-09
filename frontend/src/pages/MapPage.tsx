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
