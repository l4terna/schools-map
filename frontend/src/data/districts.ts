export const CHECHNYA_CENTER: [number, number] = [43.2, 45.7];
export const CHECHNYA_ZOOM = 8;

export interface DistrictGeo {
  shortName: string;
  center: [number, number];
  zoom: number;
  borderKeyword: string;
  color: string;
}

export const DISTRICT_GEO: Record<string, DistrictGeo> = {
  // --- id 1–13: исходные районы ---
  "Департамент образования Мэрии г.Грозного": {
    shortName: "г. Грозный",
    center: [43.3169, 45.6981],
    zoom: 9,
    borderKeyword: "грозный",
    color: "#e74c3c",
  },
  "Департамент образования г. Аргун": {
    shortName: "г. Аргун",
    center: [43.2965, 45.8727],
    zoom: 9,
    borderKeyword: "аргун",
    color: "#3498db",
  },
  "Итум-Калинский районный отдел образования": {
    shortName: "Итум-Калинский район",
    center: [42.73, 45.57],
    zoom: 9,
    borderKeyword: "итум",
    color: "#2ecc71",
  },
  "МУ 'Веденский РОО'": {
    shortName: "Веденский район",
    center: [42.97, 46.1],
    zoom: 9,
    borderKeyword: "веден",
    color: "#9b59b6",
  },
  "МУ 'Надтеречное РУО'": {
    shortName: "Надтеречный район",
    center: [43.65, 45.32],
    zoom: 9,
    borderKeyword: "надтеречн",
    color: "#f39c12",
  },
  "МУ 'Отдел образования Серноводского муниципального района'": {
    shortName: "Сунженский район",
    center: [43.32, 45.38],
    zoom: 9,
    borderKeyword: "серновод",
    color: "#1abc9c",
  },
  "МУ 'Отдел образования Шалинского муниципального района'": {
    shortName: "Шалинский район",
    center: [43.15, 45.88],
    zoom: 9,
    borderKeyword: "шалинск",
    color: "#e67e22",
  },
  "МУ 'Отдел образования Шатойского муниципального района'": {
    shortName: "Шатойский район",
    center: [42.87, 45.68],
    zoom: 9,
    borderKeyword: "шатойск",
    color: "#2980b9",
  },
  "МУ 'Шаройский районный отдел образования'": {
    shortName: "Шаройский район",
    center: [42.68, 45.98],
    zoom: 9,
    borderKeyword: "шаройск",
    color: "#8e44ad",
  },
  "МУ «Грозненское РУО»": {
    shortName: "Грозненский район",
    center: [43.4, 45.55],
    zoom: 9,
    borderKeyword: "грозненск",
    color: "#27ae60",
  },
  "МУ «Урус-Мартановское РУО»": {
    shortName: "Урус-Мартановский район",
    center: [43.13, 45.53],
    zoom: 9,
    borderKeyword: "урус",
    color: "#d35400",
  },
  "МУ»Управление образования Гудермесского муниципального района»": {
    shortName: "Гудермесский район",
    center: [43.35, 46.1],
    zoom: 9,
    borderKeyword: "гудерм",
    color: "#c0392b",
  },
  "Наурское РУО": {
    shortName: "Наурский район",
    center: [43.65, 45.83],
    zoom: 9,
    borderKeyword: "наурск",
    color: "#16a085",
  },
  // --- id 14–17: внутренние районы г. Грозного ---
  Ахматовский: {
    shortName: "Ахматовский р-н",
    center: [43.318, 45.692],
    zoom: 9,
    borderKeyword: "ахматовск",
    color: "#e17055",
  },
  Курчалоевский: {
    shortName: "Курчалоевский р-н",
    center: [43.2, 46.09],
    zoom: 9,
    borderKeyword: "курчалоевск",
    color: "#6c5ce7",
  },
  Висаитовский: {
    shortName: "Висаитовский р-н",
    center: [43.33, 45.64],
    zoom: 9,
    borderKeyword: "висаитовск",
    color: "#00cec9",
  },
  "Шейх-Мансуровский": {
    shortName: "Шейх-Мансуровский р-н",
    center: [43.31, 45.72],
    zoom: 9,
    borderKeyword: "мансуровск",
    color: "#fd79a8",
  },
  // --- id 18–21: районы ---
  Гудермесский: {
    shortName: "Гудермесский р-н",
    center: [43.35, 46.1],
    zoom: 9,
    borderKeyword: "гудермесский",
    color: "#a29bfe",
  },
  "Ачхой-Мартановский": {
    shortName: "Ачхой-Мартановский р-н",
    center: [43.19, 45.28],
    zoom: 9,
    borderKeyword: "ачхой-мартановск",
    color: "#e84393",
  },
  "Урус-Мартановский": {
    shortName: "Урус-Мартановский р-н",
    center: [43.13, 45.54],
    zoom: 9,
    borderKeyword: "урус-мартановск",
    color: "#fab1a0",
  },
  Шалинский: {
    shortName: "Шалинский р-н",
    center: [43.15, 45.9],
    zoom: 9,
    borderKeyword: "шалинский",
    color: "#55efc4",
  },
  // --- id 22–25: отделы/управления образования ---
  "Отдел образования Ачхой-Мартановского муниципального района": {
    shortName: "Ачхой-Мартановский район",
    center: [43.19, 45.28],
    zoom: 9,
    borderKeyword: "ачхой",
    color: "#ff7675",
  },
  "Управление образования Курчалоевского муниципального района": {
    shortName: "Курчалоевский район",
    center: [43.2, 46.08],
    zoom: 9,
    borderKeyword: "курчал",
    color: "#74b9ff",
  },
  "Управление образования Ножай-Юртовского муниципального района Чеченской Республики":
    {
      shortName: "Ножай-Юртовский район",
      center: [43.08, 46.38],
      zoom: 9,
      borderKeyword: "ножай",
      color: "#00b894",
    },
  "Управление образования Шелковского муниципального района": {
    shortName: "Шелковской район",
    center: [43.51, 46.35],
    zoom: 9,
    borderKeyword: "шелковск",
    color: "#fdcb6e",
  },
};

const DEFAULT_COLOR = "#3b82f6";

function findGeoByBorderName(borderName: string): DistrictGeo | null {
  const lower = borderName.toLowerCase();
  for (const geo of Object.values(DISTRICT_GEO)) {
    if (lower.includes(geo.borderKeyword)) return geo;
  }
  return null;
}

export function getDistrictColor(borderName: string): string {
  return findGeoByBorderName(borderName)?.color ?? DEFAULT_COLOR;
}

export function matchBorderToDistrictId(
  borderName: string,
  districts: { id: number | null; name: string }[],
): number | null {
  const lower = borderName.toLowerCase();

  for (const [deptName, geo] of Object.entries(DISTRICT_GEO)) {
    if (lower.includes(geo.borderKeyword)) {
      const district = districts.find((d) => d.name === deptName);
      if (district?.id != null) return district.id;
    }
  }

  return null;
}
