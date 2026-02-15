import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { loadYmaps } from "@/lib/ymaps";
import { matchBorderToDistrictId, getDistrictColor } from "@/data/districts";
import bordersGeoJSON from "@/data/borders.geojson?raw";
import republicBorderJSON from "@/data/republic-border.geojson?raw";
import type { District, School } from "@/types";

export interface YandexMapHandle {
  panTo(center: [number, number], zoom: number): void;
}

interface Props {
  center: [number, number];
  zoom: number;
  schools: School[];
  selectedSchoolName: string | null;
  onSchoolClick: (school: School) => void;
  districts: District[];
  onDistrictClick: (id: number) => void;
  selectedDistrictId: number | null;
}

function flipRing(ring: number[][]): number[][] {
  return ring.map((p) => [p[1]!, p[0]!]);
}

function schoolIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
    <filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter>
    <g filter="url(#s)">
      <path d="M18 40l-1-1C8 30 3 24 3 17a15 15 0 0 1 30 0c0 7-5 13-14 22l-1 1z" fill="${color}"/>
      <circle cx="18" cy="17" r="11" fill="white" opacity="0.95"/>
    </g>
    <path d="M18 9.5l-8 4.5 8 4.5 8-4.5z" fill="${color}"/>
    <path d="M12 15.5v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-4.5" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="26" y1="14" x2="26" y2="22" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="26" cy="22.5" r="1" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const ICON_BLUE = schoolIcon("#3b82f6");
const ICON_RED = schoolIcon("#ef4444");

export const YandexMap = forwardRef<YandexMapHandle, Props>(function YandexMap(
  {
    center,
    zoom,
    schools,
    selectedSchoolName,
    onSchoolClick,
    districts,
    onDistrictClick,
    selectedDistrictId,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const bordersRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const districtsRef = useRef(districts);
  districtsRef.current = districts;
  const districtClickRef = useRef(onDistrictClick);
  districtClickRef.current = onDistrictClick;
  const selectedDistrictIdRef = useRef(selectedDistrictId);
  selectedDistrictIdRef.current = selectedDistrictId;

  useEffect(() => {
    let destroyed = false;

    loadYmaps().then((ymaps) => {
      if (destroyed || !containerRef.current) return;
      ymapsRef.current = ymaps;

      mapRef.current = new ymaps.Map(
        containerRef.current,
        { center, zoom, controls: ["zoomControl"] },
        { suppressMapOpenBlock: true },
      );

      setReady(true);
    });

    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    panTo(c, z) {
      mapRef.current?.setCenter(c, z, { duration: 600 });
    },
  }));

  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;
    const ymaps = ymapsRef.current;
    const map = mapRef.current;

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
        {
          fillColor: "00000030",
          strokeWidth: 0,
        },
      );
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
      map.geoObjects.add(border);
    } catch (e) {
      console.warn("Could not render republic border:", e);
    }
  }, [ready]);

  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;

    const ymaps = ymapsRef.current;
    const map = mapRef.current;

    if (bordersRef.current) {
      map.geoObjects.remove(bordersRef.current);
      bordersRef.current = null;
    }

    try {
      const geojson = JSON.parse(bordersGeoJSON);
      const collection = new ymaps.GeoObjectCollection();

      for (const feature of geojson.features) {
        const coords = feature.geometry.coordinates;
        const name: string = feature.properties?.name ?? "";

        const rings =
          feature.geometry.type === "MultiPolygon"
            ? coords.flatMap((poly: number[][][]) => poly.map(flipRing))
            : coords.map(flipRing);

        const hex = getDistrictColor(name);

        const polygon = new ymaps.Polygon(
          rings,
          {
            hintContent: `<span style="font-size:14px;font-weight:500;padding:2px 4px">${name}</span>`,
            districtName: name,
            districtColor: hex,
          },
          {
            fillColor: hex + "30",
            strokeColor: hex,
            strokeStyle: "shortdash",
            strokeWidth: 2,
            cursor: "pointer",
            hintOptions: { interactivityModel: "default#transparent" },
          },
        );

        polygon.events.add("mouseenter", () => {
          const id = matchBorderToDistrictId(name, districtsRef.current);
          const isSel = id != null && id === selectedDistrictIdRef.current;
          if (!isSel) {
            polygon.options.set({
              fillColor: hex + "50",
              strokeWidth: 3,
            });
          }
        });
        polygon.events.add("mouseleave", () => {
          const id = matchBorderToDistrictId(name, districtsRef.current);
          const isSel = id != null && id === selectedDistrictIdRef.current;
          if (!isSel) {
            polygon.options.set({
              fillColor: hex + "30",
              strokeWidth: 2,
            });
          }
        });

        polygon.events.add("click", () => {
          const id = matchBorderToDistrictId(name, districtsRef.current);
          if (id != null) districtClickRef.current(id);
        });

        collection.add(polygon);
      }

      map.geoObjects.add(collection);
      bordersRef.current = collection;
    } catch (e) {
      console.warn("Could not render district borders:", e);
    }
  }, [ready]);

  useEffect(() => {
    if (!bordersRef.current) return;

    bordersRef.current.each((polygon: any) => {
      const name: string = polygon.properties.get("districtName") ?? "";
      const hex: string = polygon.properties.get("districtColor") ?? "#3b82f6";
      const id = matchBorderToDistrictId(name, districtsRef.current);
      const isSelected = id != null && id === selectedDistrictId;

      polygon.options.set({
        fillColor: isSelected ? hex + "55" : hex + "30",
        strokeColor: hex,
        strokeStyle: isSelected ? "solid" : "shortdash",
        strokeWidth: isSelected ? 4 : 2,
      });
    });
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;
    const ymaps = ymapsRef.current;
    const map = mapRef.current;

    if (clustererRef.current) {
      map.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }

    const withCoords = schools.filter((s) => s.coords !== null);
    if (withCoords.length === 0) return;

    const clusterer = new ymaps.Clusterer({
      preset: "islands#blueClusterIcons",
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
    });

    const placemarks = withCoords.map((school) => {
      const isSelected = school.name === selectedSchoolName;

      const pm = new ymaps.Placemark(
        school.coords,
        {
          hintContent: `<span style="font-size:14px;font-weight:500;padding:2px 6px">${school.name}</span>`,
        },
        {
          iconLayout: "default#image",
          iconImageHref: isSelected ? ICON_RED : ICON_BLUE,
          iconImageSize: isSelected ? [42, 49] : [36, 42],
          iconImageOffset: isSelected ? [-21, -49] : [-18, -42],
          hasBalloon: false,
        },
      );

      pm.events.add("click", () => onSchoolClick(school));
      return pm;
    });

    clusterer.add(placemarks);
    map.geoObjects.add(clusterer);
    clustererRef.current = clusterer;
  }, [ready, schools, selectedSchoolName, onSchoolClick]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {!ready && (
        <div className="flex h-full items-center justify-center bg-neutral-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
        </div>
      )}
    </div>
  );
});
