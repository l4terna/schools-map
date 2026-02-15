import { useState, useRef, useCallback } from "react";
import {
  useGetDistrictsQuery,
  useGetSchoolsByDistrictQuery,
} from "@/store/api/schoolsApi";
import { YandexMap, type YandexMapHandle } from "@/components/YandexMap";
import { Sidebar } from "@/components/Sidebar";
import { DISTRICT_GEO, CHECHNYA_CENTER, CHECHNYA_ZOOM } from "@/data/districts";
import type { School } from "@/types";

export function MapPage() {
  const mapRef = useRef<YandexMapHandle>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  );
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const { data: districts, isLoading: loadingDistricts } =
    useGetDistrictsQuery();
  const { data: schools, isFetching: loadingSchools } =
    useGetSchoolsByDistrictQuery(selectedDistrictId!, {
      skip: selectedDistrictId === null,
    });

  const selectedDistrict =
    districts?.find((d) => d.id === selectedDistrictId) ?? null;

  /* ---- callbacks ---- */

  const handleSelectDistrict = useCallback(
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
    mapRef.current?.panTo(CHECHNYA_CENTER, CHECHNYA_ZOOM);
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
      if (geo) mapRef.current?.panTo(geo.center, geo.zoom);
    }
  }, [selectedDistrict]);

  return (
    <div className="relative h-screen">
      <Sidebar
        districts={districts ?? []}
        selectedDistrict={selectedDistrict}
        schools={schools ?? []}
        selectedSchool={selectedSchool}
        loading={loadingDistricts}
        loadingSchools={loadingSchools}
        onSelectDistrict={handleSelectDistrict}
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
        onDistrictClick={handleSelectDistrict}
        selectedDistrictId={selectedDistrictId}
      />
    </div>
  );
}
