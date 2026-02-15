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
    </div>
  );
}
