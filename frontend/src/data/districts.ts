export const CHECHNYA_CENTER: [number, number] = [43.25, 45.7];
export const CHECHNYA_ZOOM = 9.45;

export interface DistrictGeo {
	shortName: string;
	center: [number, number];
	zoom: number;
	borderKeyword: string;
	color: string;
}

export const DISTRICT_GEO: Record<string, DistrictGeo> = {
	"Грозный (город)": {
		shortName: "г. Грозный",
		center: [43.3169, 45.6981],
		zoom: 10,
		borderKeyword: "грозный",
		color: "#e74c3c",
	},
	"Аргун (город)": {
		shortName: "г. Аргун",
		center: [43.2965, 45.8727],
		zoom: 10,
		borderKeyword: "аргун",
		color: "#3498db",
	},
	"Итум-Калинский р-н": {
		shortName: "Итум-Калинский р-н",
		center: [42.73, 45.57],
		zoom: 10,
		borderKeyword: "итум",
		color: "#2ecc71",
	},
	"Веденский р-н": {
		shortName: "Веденский р-н",
		center: [42.97, 46.1],
		zoom: 10,
		borderKeyword: "веден",
		color: "#9b59b6",
	},
	"Надтеречный р-н": {
		shortName: "Надтеречный р-н",
		center: [43.65, 45.32],
		zoom: 10,
		borderKeyword: "надтеречн",
		color: "#f39c12",
	},
	"Серноводский р-н": {
		shortName: "Серноводский р-н",
		center: [43.32, 45.38],
		zoom: 10,
		borderKeyword: "серновод",
		color: "#1abc9c",
	},
	"Шалинский р-н": {
		shortName: "Шалинский р-н",
		center: [43.15, 45.88],
		zoom: 10,
		borderKeyword: "шалинск",
		color: "#e67e22",
	},
	"Шатойский р-н": {
		shortName: "Шатойский р-н",
		center: [42.87, 45.68],
		zoom: 10,
		borderKeyword: "шатойск",
		color: "#2980b9",
	},
	"Шаройский р-н": {
		shortName: "Шаройский р-н",
		center: [42.63, 45.86],
		zoom: 10,
		borderKeyword: "шаройск",
		color: "#8e44ad",
	},
	"Грозненский р-н": {
		shortName: "Грозненский р-н",
		center: [43.4, 45.55],
		zoom: 10,
		borderKeyword: "грозненск",
		color: "#27ae60",
	},
	"Урус-Мартановский р-н": {
		shortName: "Урус-Мартановский р-н",
		center: [43.13, 45.53],
		zoom: 10,
		borderKeyword: "урус",
		color: "#d35400",
	},
	"Гудермесский р-н": {
		shortName: "Гудермесский р-н",
		center: [43.35, 46.1],
		zoom: 10,
		borderKeyword: "гудерм",
		color: "#c0392b",
	},
	"Наурский р-н": {
		shortName: "Наурский р-н",
		center: [43.65, 45.83],
		zoom: 10,
		borderKeyword: "наурск",
		color: "#16a085",
	},
	"Ахматовский р-н": {
		shortName: "Ахматовский р-н",
		center: [43.318, 45.692],
		zoom: 10,
		borderKeyword: "ахматовск",
		color: "#e17055",
	},
	"Курчалоевский р-н": {
		shortName: "Курчалоевский р-н",
		center: [43.2, 46.09],
		zoom: 10,
		borderKeyword: "курчалоевск",
		color: "#6c5ce7",
	},
	"Висаитовский р-н": {
		shortName: "Висаитовский р-н",
		center: [43.33, 45.64],
		zoom: 10,
		borderKeyword: "висаитовск",
		color: "#00cec9",
	},
	"Шейх-Мансуровский р-н": {
		shortName: "Шейх-Мансуровский р-н",
		center: [43.31, 45.72],
		zoom: 10,
		borderKeyword: "мансуровск",
		color: "#fd79a8",
	},
	"Ачхой-Мартановский р-н": {
		shortName: "Ачхой-Мартановский р-н",
		center: [43.19, 45.28],
		zoom: 10,
		borderKeyword: "ачхой",
		color: "#ff7675",
	},
	"Ножай-Юртовский р-н": {
		shortName: "Ножай-Юртовский р-н",
		center: [43.08, 46.38],
		zoom: 10,
		borderKeyword: "ножай",
		color: "#00b894",
	},
	"Шелковской р-н": {
		shortName: "Шелковской р-н",
		center: [43.51, 46.35],
		zoom: 10,
		borderKeyword: "шелковск",
		color: "#fdcb6e",
	},
	"Байсангуровский р-н": {
		shortName: "Байсангуровский р-н",
		center: [43.3, 45.72],
		zoom: 11,
		borderKeyword: "байсангуровск",
		color: "#0984e3",
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
