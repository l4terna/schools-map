import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import {
	useCheckDataExistsQuery,
	useUploadDataMutation,
	useLogoutMutation,
} from "@/store/api/schoolsApi";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminDashboardPage() {
	const fileRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	const {
		data: dataStatus,
		isLoading: checkingAuth,
		error: authError,
	} = useCheckDataExistsQuery();

	const [upload, { isLoading: uploading }] = useUploadDataMutation();
	const [logout] = useLogoutMutation();

	const [dragging, setDragging] = useState(false);
	const [uploadResult, setUploadResult] = useState<{
		ok: boolean;
		message: string;
	} | null>(null);

	const is401 =
		authError != null && "status" in authError && authError.status === 401;

	if (is401) {
		return <Navigate to="/admin/login" replace />;
	}

	if (checkingAuth) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center bg-neutral-50 dark:bg-neutral-900">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-blue-600" />
			</div>
		);
	}

	async function doUpload(file: File) {
		if (!file.name.toLowerCase().endsWith(".xlsx")) {
			setUploadResult({
				ok: false,
				message: "Только .xlsx файлы",
			});
			return;
		}

		setUploadResult(null);
		const fd = new FormData();
		fd.append("file", file);

		try {
			await upload(fd).unwrap();
			setUploadResult({ ok: true, message: "Файл успешно загружен" });
		} catch {
			setUploadResult({
				ok: false,
				message: "Не удалось загрузить файл. Проверьте формат (.xlsx)",
			});
		}

		if (fileRef.current) fileRef.current.value = "";
	}

	function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) doUpload(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		setDragging(true);
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) doUpload(file);
	}

	async function handleLogout() {
		await logout().unwrap();
		navigate("/admin/login");
	}

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
			<div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
				<div className="mb-4 flex flex-wrap items-center gap-2">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
					>
						Главная
					</Link>
					<Link
						to="/map"
						className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-neutral-900/30 transition hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 sm:inline-flex"
					>
						Карта школ
					</Link>
					<ThemeToggle />
					<button
						onClick={handleLogout}
						className="ml-auto text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 sm:text-sm"
					>
						Выйти
					</button>
				</div>
				<h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
					Админ-панель
				</h1>

				<section className="mt-6 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-8 sm:p-6">
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						Данные (Excel)
					</h2>

					<p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
						Статус:{" "}
						{dataStatus?.exists ? (
							<span className="font-medium text-green-600">файл загружен</span>
						) : (
							<span className="font-medium text-amber-600">
								файл отсутствует
							</span>
						)}
					</p>

					<label
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition sm:p-8 ${
							dragging
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
								: "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
						}`}
					>
						<div className="text-3xl text-neutral-300 dark:text-neutral-600">
							{uploading ? (
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-600" />
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="32"
									height="32"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
							)}
						</div>
						<p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
							{uploading ? "Загрузка..." : "Перетащите .xlsx сюда или нажмите"}
						</p>
						<p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
							Поддерживается только формат .xlsx
						</p>
						<input
							ref={fileRef}
							type="file"
							accept=".xlsx"
							onChange={handleFileInput}
							className="hidden"
							disabled={uploading}
						/>
					</label>

					{uploadResult && (
						<p
							className={`mt-4 text-sm font-medium ${uploadResult.ok ? "text-green-600" : "text-red-500"}`}
						>
							{uploadResult.message}
						</p>
					)}

					{dataStatus?.exists && (
						<a
							href="/api/admin/data/download"
							className="mt-4 inline-block rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-700"
						>
							Скачать текущий файл
						</a>
					)}
				</section>

				<section className="mt-4 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-6 sm:p-6">
					<h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
						Инструкция по заполнению Excel
					</h2>

					<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
						Файл должен быть в формате <strong>.xlsx</strong>. Первая строка —
						заголовки столбцов (произвольные, парсер ориентируется по порядку
						колонок). Данные начинаются со второй строки.
					</p>

					<div className="mt-5">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Основной формат (22 колонки, A–V)
						</h3>
						<div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
							<table className="w-full text-left text-xs">
								<thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
									<tr>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											№
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Колонка
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Тип
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Пример
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 text-neutral-700 dark:text-neutral-300">
									{[
										["A", "Порядковый номер", "Число", "1"],
										["B", "Название школы", "Текст", "СОШ №1 г. Грозный"],
										["C", "Смена", "Число", "2"],
										["D", "Мощность (мест)", "Число", "500"],
										["E", "Кол-во учащихся", "Число", "430"],
										["F", "Кол-во работников", "Число", "60"],
										["G", "Кол-во учителей", "Число", "35"],
										["H", "Сайт школы", "Текст/URL", "school1.edu"],
										["I", "Широта", "Число", "43.3175"],
										["J", "Долгота", "Число", "45.6940"],
										["K", "Адрес", "Текст", "ул. Ленина, 1"],
										["L", "Район/Департамент", "Текст", "Грозный (город)"],
										["M", "Государственная", "Да/Нет", "Да"],
										["N", "Религиозная", "Да/Нет", "Нет"],
										["O", "Кол-во зданий", "Число", "3"],
										["P", "Отремонтирована", "Да/Нет", "Да"],
										["Q", "Требует ремонта", "Да/Нет", "Нет"],
										["R", "Аварийное состояние", "Да/Нет", "Нет"],
										["S", "Обуч. во 2 смену", "Число", "244"],
										["T", "Строится", "Да/Нет", "Да"],
										["U", "ШНОР", "Да/Нет", "Да"],
										["V", "Школа с необъективностью", "Да/Нет", "Нет"],
									].map(([col, name, type, example]) => (
										<tr key={col}>
											<td className="whitespace-nowrap px-3 py-1.5 font-mono text-neutral-400 dark:text-neutral-500">
												{col}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5 font-medium">
												{name}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5 text-neutral-500 dark:text-neutral-400">
												{type}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5 text-neutral-400 dark:text-neutral-500">
												{example}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Когда строка загружается
						</h3>
						<p>
							Строка попадает в систему, если заполнено{" "}
							<strong>хотя бы одно</strong> из двух полей:{" "}
							<strong>район</strong> (L) или <strong>координаты</strong> (I +
							J). Если оба поля пустые — строка пропускается. Все остальные поля
							необязательны и могут быть пустыми.
						</p>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Правила заполнения
						</h3>
						<ul className="list-inside list-disc space-y-1.5 pl-1">
							<li>
								Колонка <strong>«Район/Департамент»</strong> (L) должна точно
								совпадать с одним из известных названий районов (например,{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									Грозный (город)
								</code>
								). Районы создаются автоматически на основе этого поля.
							</li>
							<li>
								<strong>Координаты</strong> (I, J) — десятичные числа (например,{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									43.3175
								</code>
								). Нужны обе колонки для отображения школы на карте. Если
								координат нет — школа появится в списке, но не на карте.
							</li>
							<li>
								Поля типа <strong>Да/Нет</strong> (M, N, P–R, T–V) принимают:{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									Да
								</code>
								,{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									Нет
								</code>{" "}
								(или пусто = Нет).
							</li>
							<li>Пустые числовые поля (C–G, O, S) отобразятся как «—».</li>
							<li>
								Название школы (B) может быть пустым — строка всё равно
								загрузится, если указан район или координаты.
							</li>
							<li>
								Статистика по районам (учащиеся, работники, учителя)
								рассчитывается <strong>автоматически</strong> как сумма по
								школам.
							</li>
						</ul>
					</div>
				</section>
			</div>
		</div>
	);
}
