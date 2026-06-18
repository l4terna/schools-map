export interface District {
  id: number | null;
  name: string;
  students: number | null;
  teachers: number | null;
  workers: number | null;
}

export interface School {
  name: string;
  shift: number | null;
  capacity: number | null;
  students: number | null;
  workers: number | null;
  teachers: number | null;
  site: string | null;
  district: string | null;
  is_state: boolean;
  is_religional: boolean;
  second_shift_students: number | null;
  buildings: number | null;
  renovated: boolean;
  needs_repairs: boolean;
  critical_condition: boolean;
  form: boolean;
  shkon: boolean;
  a_school_with_bias: boolean;
  address: string | null;
  coords: [number, number] | null;
}

export interface LoginPayload {
  login: string;
  password: string;
}

/** Школа в админке — это School + числовой id. */
export interface AdminSchool extends School {
  id: number;
}

export interface AdminStats {
  districts: number;
  schools: number;
  students: number;
  without_coords: number;
  needs_repairs: number;
  critical_condition: number;
  renovated: number;
  second_shift: number;
  a_school_with_bias: number;
}

export interface AdminDistrict {
  id: number;
  name: string;
  school_count: number;
  students: number;
  workers: number;
  teachers: number;
}

export interface AdminSchoolsResponse {
  items: AdminSchool[];
  total: number;
  limit: number;
  offset: number;
}

export type SchoolSortKey =
  | "id"
  | "name"
  | "district"
  | "students"
  | "capacity"
  | "workers"
  | "teachers";

/** Булевы фильтры таблицы школ (tri-state: undefined = «все»). */
export interface SchoolBoolFilters {
  is_state?: boolean;
  is_religional?: boolean;
  renovated?: boolean;
  needs_repairs?: boolean;
  critical_condition?: boolean;
  form?: boolean;
  shkon?: boolean;
  a_school_with_bias?: boolean;
  has_coords?: boolean;
}

export interface AdminSchoolsParams extends SchoolBoolFilters {
  q?: string;
  district_id?: number;
  limit?: number;
  offset?: number;
  sort?: SchoolSortKey;
  order?: "asc" | "desc";
}

/** Тело запроса для создания/обновления школы. */
export interface SchoolInput {
  name?: string | null;
  district?: string | null;
  district_id?: number | null;
  address?: string | null;
  coords?: [number, number] | null;
  students?: number | null;
  shift?: number | null;
  capacity?: number | null;
  workers?: number | null;
  teachers?: number | null;
  site?: string | null;
  second_shift_students?: number | null;
  buildings?: number | null;
  is_state?: boolean;
  is_religional?: boolean;
  renovated?: boolean;
  needs_repairs?: boolean;
  critical_condition?: boolean;
  form?: boolean;
  shkon?: boolean;
  a_school_with_bias?: boolean;
}
