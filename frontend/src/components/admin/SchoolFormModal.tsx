import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
	useCreateSchoolMutation,
	useUpdateSchoolMutation,
	useDeleteSchoolMutation,
} from "@/store/api/schoolsApi";
import type { AdminSchool, AdminDistrict, SchoolInput } from "@/types";
import { CoordPicker } from "./CoordPicker";

interface Props {
	school: AdminSchool | null; // null => создание
	districts: AdminDistrict[];
	onClose: () => void;
}

interface FormState {
	name: string;
	district_id: string;
	address: string;
	latitude: string;
	longitude: string;
	students: string;
	shift: string;
	capacity: string;
	workers: string;
	teachers: string;
	second_shift_students: string;
	buildings: string;
	site: string;
	is_state: boolean;
	is_religional: boolean;
	renovated: boolean;
	needs_repairs: boolean;
	critical_condition: boolean;
	form: boolean;
	shkon: boolean;
	a_school_with_bias: boolean;
}

const BOOL_FIELDS: { key: keyof FormState; label: string }[] = [
	{ key: "is_state", label: "Государственная" },
	{ key: "is_religional", label: "Религиозная" },
	{ key: "renovated", label: "Отремонтирована" },
	{ key: "needs_repairs", label: "Требует ремонта" },
	{ key: "critical_condition", label: "Аварийное состояние" },
	{ key: "form", label: "Строится" },
	{ key: "shkon", label: "ШНОР" },
	{ key: "a_school_with_bias", label: "С необъективностью" },
];

function buildInitialState(
	school: AdminSchool | null,
	districts: AdminDistrict[],
): FormState {
	const matchedId =
		school?.district != null
			? districts.find((d) => d.name === school.district)?.id
			: undefined;
	return {
		name: school?.name ?? "",
		district_id: matchedId != null ? String(matchedId) : "",
		address: school?.address ?? "",
		latitude: school?.coords?.[0] != null ? String(school.coords[0]) : "",
		longitude: school?.coords?.[1] != null ? String(school.coords[1]) : "",
		students: school?.students != null ? String(school.students) : "",
		shift: school?.shift != null ? String(school.shift) : "",
		capacity: school?.capacity != null ? String(school.capacity) : "",
		workers: school?.workers != null ? String(school.workers) : "",
		teachers: school?.teachers != null ? String(school.teachers) : "",
		second_shift_students:
			school?.second_shift_students != null
				? String(school.second_shift_students)
				: "",
		buildings: school?.buildings != null ? String(school.buildings) : "",
		site: school?.site ?? "",
		is_state: school?.is_state ?? false,
		is_religional: school?.is_religional ?? false,
		renovated: school?.renovated ?? false,
		needs_repairs: school?.needs_repairs ?? false,
		critical_condition: school?.critical_condition ?? false,
		form: school?.form ?? false,
		shkon: school?.shkon ?? false,
		a_school_with_bias: school?.a_school_with_bias ?? false,
	};
}

function numOrNull(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed === "") return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : null;
}

function strOrNull(value: string): string | null {
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
}

const labelCls =
	"mb-1 block text-xs font-semibold text-neutral-500 dark:text-neutral-400";
const inputCls =
	"w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-500";

function TextField({
	label,
	value,
	onChange,
	type = "text",
	placeholder,
	step,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	placeholder?: string;
	step?: string;
}) {
	return (
		<div>
			<label className={labelCls}>{label}</label>
			<input
				type={type}
				step={step}
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				className={inputCls}
			/>
		</div>
	);
}

export function SchoolFormModal({ school, districts, onClose }: Props) {
	const isEdit = school !== null;
	const [form, setForm] = useState<FormState>(() =>
		buildInitialState(school, districts),
	);
	const [error, setError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const [createSchool, { isLoading: creating }] = useCreateSchoolMutation();
	const [updateSchool, { isLoading: updating }] = useUpdateSchoolMutation();
	const [deleteSchool, { isLoading: deleting }] = useDeleteSchoolMutation();
	const saving = creating || updating;

	useEffect(() => {
		setForm(buildInitialState(school, districts));
		setError(null);
		setConfirmDelete(false);
	}, [school, districts]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const sortedDistricts = useMemo(
		() => [...districts].sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[districts],
	);

	function buildPayload(): SchoolInput {
		const lat = numOrNull(form.latitude);
		const lng = numOrNull(form.longitude);
		return {
			name: strOrNull(form.name),
			district_id:
				form.district_id === "" ? null : Number(form.district_id),
			address: strOrNull(form.address),
			coords: lat != null && lng != null ? [lat, lng] : null,
			students: numOrNull(form.students),
			shift: numOrNull(form.shift),
			capacity: numOrNull(form.capacity),
			workers: numOrNull(form.workers),
			teachers: numOrNull(form.teachers),
			second_shift_students: numOrNull(form.second_shift_students),
			buildings: numOrNull(form.buildings),
			site: strOrNull(form.site),
			is_state: form.is_state,
			is_religional: form.is_religional,
			renovated: form.renovated,
			needs_repairs: form.needs_repairs,
			critical_condition: form.critical_condition,
			form: form.form,
			shkon: form.shkon,
			a_school_with_bias: form.a_school_with_bias,
		};
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		const payload = buildPayload();
		if ((form.latitude.trim() === "") !== (form.longitude.trim() === "")) {
			setError("Укажите обе координаты (широту и долготу) либо оставьте обе пустыми");
			return;
		}
		try {
			if (isEdit && school) {
				await updateSchool({ id: school.id, body: payload }).unwrap();
			} else {
				await createSchool(payload).unwrap();
			}
			onClose();
		} catch {
			setError("Не удалось сохранить. Проверьте введённые данные.");
		}
	}

	async function handleDelete() {
		if (!school) return;
		setError(null);
		try {
			await deleteSchool(school.id).unwrap();
			onClose();
		} catch {
			setError("Не удалось удалить школу.");
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
			onClick={onClose}
		>
			<div
				className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-neutral-800 shadow-2xl sm:rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex shrink-0 items-center justify-between border-b border-neutral-100 dark:border-neutral-700 px-5 py-4">
					<h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 sm:text-lg">
						{isEdit ? "Редактирование школы" : "Новая школа"}
						{isEdit && (
							<span className="ml-2 text-xs font-medium text-neutral-400 dark:text-neutral-500">
								#{school!.id}
							</span>
						)}
					</h2>
					<button
						onClick={onClose}
						className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
						aria-label="Закрыть"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<form
					id="school-form"
					onSubmit={handleSubmit}
					className="table-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5"
				>
					<section className="space-y-4">
						<TextField
							label="Название школы"
							value={form.name}
							onChange={(v) => set("name", v)}
							placeholder="СОШ №1 г. Грозный"
						/>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className={labelCls}>Район</label>
								<select
									value={form.district_id}
									onChange={(e) => set("district_id", e.target.value)}
									className={inputCls}
								>
									<option value="">— не указан —</option>
									{sortedDistricts.map((d) => (
										<option key={d.id} value={d.id}>
											{d.name}
										</option>
									))}
								</select>
							</div>
							<TextField
								label="Сайт"
								value={form.site}
								onChange={(v) => set("site", v)}
								placeholder="school1.edu"
							/>
						</div>
						<TextField
							label="Адрес"
							value={form.address}
							onChange={(v) => set("address", v)}
							placeholder="ул. Ленина, 1"
						/>
						<div className="grid grid-cols-2 gap-4">
							<TextField
								label="Широта"
								value={form.latitude}
								onChange={(v) => set("latitude", v)}
								type="number"
								step="any"
								placeholder="43.3175"
							/>
							<TextField
								label="Долгота"
								value={form.longitude}
								onChange={(v) => set("longitude", v)}
								type="number"
								step="any"
								placeholder="45.6940"
							/>
						</div>
						<CoordPicker
							lat={numOrNull(form.latitude)}
							lng={numOrNull(form.longitude)}
							onChange={(la, lo) =>
								setForm((prev) => ({
									...prev,
									latitude: String(la),
									longitude: String(lo),
								}))
							}
							onClear={() =>
								setForm((prev) => ({ ...prev, latitude: "", longitude: "" }))
							}
						/>
					</section>

					<section>
						<h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
							Показатели
						</h3>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
							<TextField label="Смена" value={form.shift} onChange={(v) => set("shift", v)} type="number" />
							<TextField label="Мощность (мест)" value={form.capacity} onChange={(v) => set("capacity", v)} type="number" />
							<TextField label="Обучающихся" value={form.students} onChange={(v) => set("students", v)} type="number" />
							<TextField label="Во 2 смену" value={form.second_shift_students} onChange={(v) => set("second_shift_students", v)} type="number" />
							<TextField label="Работников" value={form.workers} onChange={(v) => set("workers", v)} type="number" />
							<TextField label="Педагогов" value={form.teachers} onChange={(v) => set("teachers", v)} type="number" />
							<TextField label="Зданий" value={form.buildings} onChange={(v) => set("buildings", v)} type="number" />
						</div>
					</section>

					<section>
						<h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
							Характеристики
						</h3>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{BOOL_FIELDS.map(({ key, label }) => {
								const checked = form[key] as boolean;
								return (
									<label
										key={key}
										aria-pressed={checked}
										className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition select-none active:scale-[0.98] ${
											checked
												? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
												: "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600"
										}`}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={(e) => set(key, e.target.checked as never)}
											className="sr-only"
										/>
										<span
											className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
												checked
													? "border-blue-600 bg-blue-600 text-white"
													: "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800"
											}`}
										>
											{checked && (
												<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
												</svg>
											)}
										</span>
										{label}
									</label>
								);
							})}
						</div>
					</section>

					{error && (
						<p className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">
							{error}
						</p>
					)}
				</form>

				{/* Footer */}
				<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-neutral-100 dark:border-neutral-700 px-5 py-4">
					{isEdit &&
						(confirmDelete ? (
							<div className="flex items-center gap-2">
								<span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
									Точно удалить?
								</span>
								<button
									onClick={handleDelete}
									disabled={deleting}
									className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
								>
									{deleting ? "Удаление..." : "Да, удалить"}
								</button>
								<button
									onClick={() => setConfirmDelete(false)}
									className="rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200"
								>
									Отмена
								</button>
							</div>
						) : (
							<button
								onClick={() => setConfirmDelete(true)}
								className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95"
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								Удалить навсегда
							</button>
						))}

					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={onClose}
							className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95"
						>
							Отмена
						</button>
						<button
							type="submit"
							form="school-form"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
						>
							{saving && (
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
							)}
							{isEdit ? "Сохранить" : "Создать"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
