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
  address: string | null;
  coords: [number, number] | null;
}

export interface LoginPayload {
  login: string;
  password: string;
}
