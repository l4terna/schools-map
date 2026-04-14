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
