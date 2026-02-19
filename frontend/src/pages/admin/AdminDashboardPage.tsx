import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import {
	useCheckDataExistsQuery,
	useUploadDataMutation,
	useLogoutMutation,
} from "@/store/api/schoolsApi";
import { Navigate, useNavigate } from "react-router-dom";

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
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600" />
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
		<div className="mx-auto max-w-2xl px-4 py-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-neutral-900">Админ-панель</h1>
				<button
					onClick={handleLogout}
					className="text-sm text-neutral-500 hover:text-neutral-800"
				>
					Выйти
				</button>
			</div>

			<section className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
				<h2 className="text-lg font-semibold text-neutral-900">
					Данные (Excel)
				</h2>

				<p className="mt-2 text-sm text-neutral-500">
					Статус:{" "}
					{dataStatus?.exists ? (
						<span className="font-medium text-green-600">файл загружен</span>
					) : (
						<span className="font-medium text-amber-600">файл отсутствует</span>
					)}
				</p>

				<label
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
						dragging
							? "border-blue-500 bg-blue-50"
							: "border-neutral-200 bg-neutral-50 hover:border-blue-300 hover:bg-blue-50/50"
					}`}
				>
					<div className="text-3xl text-neutral-300">
						{uploading ? (
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
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
					<p className="mt-3 text-sm font-medium text-neutral-600">
						{uploading ? "Загрузка..." : "Перетащите .xlsx сюда или нажмите"}
					</p>
					<p className="mt-1 text-xs text-neutral-400">
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
						className="mt-4 inline-block rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
					>
						Скачать текущий файл
					</a>
				)}
			</section>

			<section className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
				<h2 className="text-lg font-semibold text-neutral-900">
					Инструкция по заполнению Excel
				</h2>

				<p className="mt-3 text-sm text-neutral-600">
					Файл должен быть в формате <strong>.xlsx</strong>. Первая строка —
					заголовки столбцов (произвольные, парсер ориентируется по порядку
					колонок). Данные начинаются со второй строки.
				</p>

				<div className="mt-5">
					<h3 className="text-sm font-semibold text-neutral-800">
						Основной формат (13 колонок)
					</h3>
					<div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200">
						<table className="w-full text-left text-xs">
							<thead className="bg-neutral-50 text-neutral-500">
								<tr>
									<th className="whitespace-nowrap px-3 py-2 font-medium">№</th>
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
							<tbody className="divide-y divide-neutral-100 text-neutral-700">
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
									[
										"L",
										"Район/Департамент",
										"Текст",
										"Департамент образования Мэрии г.Грозного",
									],
									["M", "Государственная", "Да/Нет", "Да"],
								].map(([col, name, type, example]) => (
									<tr key={col}>
										<td className="whitespace-nowrap px-3 py-1.5 font-mono text-neutral-400">
											{col}
										</td>
										<td className="whitespace-nowrap px-3 py-1.5 font-medium">
											{name}
										</td>
										<td className="whitespace-nowrap px-3 py-1.5 text-neutral-500">
											{type}
										</td>
										<td className="whitespace-nowrap px-3 py-1.5 text-neutral-400">
											{example}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="mt-5 space-y-2 text-sm text-neutral-600">
					<h3 className="text-sm font-semibold text-neutral-800">
						Важные условия
					</h3>
					<ul className="list-inside list-disc space-y-1.5 pl-1">
						<li>
							<strong>Все 13 колонок обязательны</strong> — строки с пустыми
							ячейками будут пропущены.
						</li>
						<li>
							Колонка <strong>«Район/Департамент»</strong> (L) должна точно
							совпадать с одним из известных названий районов (например,{" "}
							<code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
								Департамент образования Мэрии г.Грозного
							</code>
							). Районы создаются автоматически на основе этого поля.
						</li>
						<li>
							Колонка <strong>«Государственная»</strong> (M) принимает значения:{" "}
							<code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
								Да
							</code>
							,{" "}
							<code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
								Нет
							</code>{" "}
							(или пусто = Нет).
						</li>
						<li>
							<strong>Координаты</strong> (I, J) — десятичные числа (например,{" "}
							<code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
								43.3175
							</code>
							). Используются для отображения школы на карте.
						</li>
						<li>
							Статистика по районам (учащиеся, работники, учителя)
							рассчитывается <strong>автоматически</strong> как сумма по школам.
						</li>
					</ul>
				</div>

				<details className="mt-5">
					<summary className="cursor-pointer text-sm font-semibold text-neutral-500 hover:text-neutral-700">
						Устаревший формат (менее 13 колонок)
					</summary>
					<div className="mt-3 space-y-2 text-sm text-neutral-600">
						<p>
							Если в файле менее 13 колонок, используется устаревший формат, где
							районы указываются отдельными строками (без порядкового номера и
							сайта), а координаты — в одной ячейке через запятую{" "}
							<code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
								43.3175, 45.6940
							</code>
							.
						</p>
						<div className="overflow-x-auto rounded-lg border border-neutral-200">
							<table className="w-full text-left text-xs">
								<thead className="bg-neutral-50 text-neutral-500">
									<tr>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											№
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Колонка
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 text-neutral-700">
									{[
										["A", "Порядковый номер"],
										["B", "Название (школа или район)"],
										["C", "Смена"],
										["D", "Мощность"],
										["E", "Учащиеся"],
										["F", "Работники"],
										["G", "Учителя"],
										["H", "Сайт"],
										["I", "Государственная (Да/Нет)"],
										["J", "Адрес"],
										["K", "Координаты (широта, долгота)"],
									].map(([col, name]) => (
										<tr key={col}>
											<td className="whitespace-nowrap px-3 py-1.5 font-mono text-neutral-400">
												{col}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5">{name}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</details>
			</section>
		</div>
	);
}
