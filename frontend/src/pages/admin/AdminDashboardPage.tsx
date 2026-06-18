import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import {
	useCheckDataExistsQuery,
	useLogoutMutation,
	useGetDbStatusQuery,
	useImportExcelMutation,
	useClearDbMutation,
	useUploadDataMutation,
} from "@/store/api/schoolsApi";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminDashboardPage() {
	const fileRef = useRef<HTMLInputElement>(null);
	const fallbackFileRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	const {
		data: dataStatus,
		isLoading: checkingAuth,
		error: authError,
	} = useCheckDataExistsQuery();

	const {
		data: dbStatus,
		isLoading: checkingDb,
		error: dbError,
	} = useGetDbStatusQuery();

	const [importExcel, { isLoading: importing }] = useImportExcelMutation();
	const [clearDb, { isLoading: clearing }] = useClearDbMutation();
	const [uploadFallbackExcel, { isLoading: uploadingFallback }] =
		useUploadDataMutation();
	const [logout] = useLogoutMutation();

	const [dragging, setDragging] = useState(false);
	const [uploadResult, setUploadResult] = useState<{
		ok: boolean;
		message: string;
	} | null>(null);
	const [dbResult, setDbResult] = useState<{
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
		setDbResult(null);
		const fd = new FormData();
		fd.append("file", file);

		try {
			await importExcel(fd).unwrap();
			setDbResult({
				ok: true,
				message: "Файл успешно импортирован в базу",
			});
		} catch (error) {
			console.error(error);
			setDbResult({
				ok: false,
				message:
					"Не удалось импортировать файл в базу. Проверьте формат (.xlsx)",
			});
		}

		if (fileRef.current) fileRef.current.value = "";
	}

	async function uploadFallbackFile(file: File) {
		if (!file.name.toLowerCase().endsWith(".xlsx")) {
			setUploadResult({
				ok: false,
				message: "Только .xlsx файлы",
			});
			return;
		}

		setUploadResult(null);
		setDbResult(null);
		const fd = new FormData();
		fd.append("file", file);

		try {
			await uploadFallbackExcel(fd).unwrap();
			setUploadResult({
				ok: true,
				message: "Fallback Excel успешно обновлен",
			});
		} catch (error) {
			console.error(error);
			setUploadResult({
				ok: false,
				message: "Не удалось обновить fallback Excel",
			});
		}

		if (fallbackFileRef.current) fallbackFileRef.current.value = "";
	}

	async function handleExport() {
		setDbResult(null);

		try {
			const response = await fetch("/api/admin/export/excel", {
				method: "GET",
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Ошибка экспорта Excel");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "schools_db_export.xlsx";
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			setDbResult({ ok: true, message: "Экспорт выполнен" });
		} catch (error) {
			console.error(error);
			setDbResult({
				ok: false,
				message: "Не удалось экспортировать данные из базы",
			});
		}
	}

	async function handleClear() {
		if (
			!window.confirm(
				"Очистить базу данных? Это действие необратимо.",
			)
		) {
			return;
		}

		setDbResult(null);

		try {
			await clearDb().unwrap();
			setDbResult({
				ok: true,
				message: "База данных успешно очищена",
			});
		} catch (error) {
			console.error(error);
			setDbResult({
				ok: false,
				message: "Не удалось очистить базу данных",
			});
		}
	}

	function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) doUpload(file);
	}

	function handleFallbackFileInput(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) uploadFallbackFile(file);
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
						Состояние базы данных
					</h2>

					{checkingDb ? (
						<div className="mt-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-blue-600" />
							Проверка связи с базой...
						</div>
					) : dbError ? (
						<p className="mt-4 text-sm font-medium text-red-600">
							Не удалось получить статус базы данных.
						</p>
					) : (
						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4">
								<p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
									Подключение
								</p>
								<p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
									{dbStatus?.connected ? "Да" : "Нет"}
								</p>
							</div>
							<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4">
								<p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
									Районов
								</p>
								<p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
									{dbStatus?.districts ?? 0}
								</p>
							</div>
							<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4">
								<p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
									Школ
								</p>
								<p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
									{dbStatus?.schools ?? 0}
								</p>
							</div>
						</div>
					)}

					<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
						<button
							onClick={handleExport}
							disabled={checkingDb}
							className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
						>
							Экспорт в Excel
						</button>
						<button
							onClick={handleClear}
							disabled={clearing || checkingDb}
							className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-red-950"
						>
							Очистить базу
						</button>
					</div>

					{dbResult && (
						<p
							className={`mt-4 text-sm font-medium ${
								dbResult.ok ? "text-green-600" : "text-red-500"
							}`}
						>
							{dbResult.message}
						</p>
					)}
				</section>

				<section className="mt-6 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-8 sm:p-6">
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						Данные (Excel)
					</h2>

					<p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
						Статус:{" "}
						{dataStatus?.exists ? (
							<span className="font-medium text-green-600">
								файл загружен
							</span>
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
							{importing ? (
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
							{importing
								? "Загрузка..."
								: "Перетащите .xlsx сюда или нажмите"}
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
							disabled={importing}
						/>
					</label>

					{uploadResult && (
						<p
							className={`mt-4 text-sm font-medium ${
								uploadResult.ok ? "text-green-600" : "text-red-500"
							}`}
						>
							{uploadResult.message}
						</p>
					)}

					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
						{dataStatus?.exists && (
							<a
								href="/api/admin/data/download"
								className="inline-flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-700"
							>
								Скачать текущий файл
							</a>
						)}
						<label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-900/40">
							{uploadingFallback
								? "Загрузка fallback..."
								: "Загрузить fallback Excel"}
							<input
								ref={fallbackFileRef}
								type="file"
								accept=".xlsx"
								onChange={handleFallbackFileInput}
								className="hidden"
								disabled={uploadingFallback}
							/>
						</label>
					</div>
				</section>

				<section className="mt-4 rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-lg dark:shadow-neutral-900/40 sm:mt-6 sm:p-6">
					<h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
						Инструкция по импорту Excel в PostgreSQL
					</h2>

					<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
						Проект сейчас хранит рабочие данные в PostgreSQL. Excel оставлен как
						формат обмена, резервного копирования и аварийного чтения данных при
						сбое подключения к SQL. Зона загрузки выше импортирует файл именно в
						базу данных.
					</p>

					<div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
						<strong>Важно:</strong> импорт полностью заменяет текущие записи в
						таблицах PostgreSQL данными из загруженного файла. Перед импортом
						сделайте резервную копию через кнопку <strong>Экспорт в Excel</strong>.
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Как подготовить файл
						</h3>
						<ol className="list-inside list-decimal space-y-1.5 pl-1">
							<li>
								Нажмите <strong>Экспорт в Excel</strong>.
							</li>
							<li>
								Откройте скачанный файл{" "}
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									schools_db_export.xlsx
								</code>
								.
							</li>
							<li>Отредактируйте нужные данные на вкладках файла.</li>
							<li>
								Загрузите этот же файл в зону{" "}
								<strong>Перетащите .xlsx сюда или нажмите</strong>.
							</li>
						</ol>
					</div>

					<div className="mt-5">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Обязательные листы и колонки
						</h3>
						<div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
							<table className="w-full text-left text-xs">
								<thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
									<tr>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Лист
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Назначение
										</th>
										<th className="whitespace-nowrap px-3 py-2 font-medium">
											Колонки
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 text-neutral-700 dark:text-neutral-300">
									{[
										[
											"Republic",
											"общая запись по республике",
											"id, name, total_students, total_schools",
										],
										[
											"Districts",
											"районы и связь с республикой",
											"id, name, republic_id",
										],
										[
											"Schools",
											"основные данные школ",
											"id, name, district_id, address, coords, capacity, students, latitude, longitude",
										],
										[
											"School Details",
											"дополнительные параметры школ",
											"id, school_id, shift, second_shift_students, workers, teachers, site, is_state, is_religious, buildings, needs_repairs, critical_condition, renovated, shnor, a_school_with_bias, shkon, form",
										],
									].map(([sheet, purpose, columns]) => (
										<tr key={sheet}>
											<td className="whitespace-nowrap px-3 py-1.5 font-mono text-neutral-500 dark:text-neutral-400">
												{sheet}
											</td>
											<td className="whitespace-nowrap px-3 py-1.5">
												{purpose}
											</td>
											<td className="min-w-[360px] px-3 py-1.5 font-mono text-neutral-500 dark:text-neutral-400">
												{columns}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
						<h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							Чем отличаются кнопки
						</h3>
						<ul className="list-inside list-disc space-y-1.5 pl-1">
							<li>
								<strong>Экспорт в Excel</strong> берет данные из PostgreSQL и
								создает файл в формате, который подходит для обратного импорта.
							</li>
							<li>
								<strong>Скачать текущий файл</strong> скачивает файл
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									{" "}
									backend/database/data.xlsx
								</code>
								. Этот файл нужен для старого Excel-сценария и аварийного
								fallback, но он может не совпадать с текущим состоянием SQL.
							</li>
							<li>
								<strong>Загрузить fallback Excel</strong> заменяет только файл
								<code className="rounded bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 text-xs">
									{" "}
									backend/database/data.xlsx
								</code>
								. PostgreSQL при этом не изменяется.
							</li>
							<li>
								Старый формат с одной широкой таблицей A-V не является форматом
								этого SQL-импорта. Для загрузки в базу используйте файл с 4
								листами, полученный через <strong>Экспорт в Excel</strong>.
							</li>
						</ul>
					</div>
				</section>
			</div>
		</div>
	);
}
