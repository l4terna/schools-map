import { useState } from "react";
import type { District, School } from "@/types";
import { DISTRICT_GEO } from "@/data/districts";

interface SidebarProps {
  districts: District[];
  selectedDistrict: District | null;
  schools: School[];
  selectedSchool: School | null;
  loading: boolean;
  loadingSchools: boolean;
  onSelectDistrict: (id: number) => void;
  onSelectSchool: (school: School) => void;
  onBack: () => void;
  onBackToSchools: () => void;
}

export function Sidebar({
  districts,
  selectedDistrict,
  schools,
  selectedSchool,
  loading,
  loadingSchools,
  onSelectDistrict,
  onSelectSchool,
  onBack,
  onBackToSchools,
}: SidebarProps) {
  return (
    <aside className="absolute bottom-4 left-4 top-4 z-10 flex w-95 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_40px_rgba(0,0,0,0.08)]">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loading />
        </div>
      ) : selectedSchool ? (
        <SchoolDetail school={selectedSchool} onBack={onBackToSchools} />
      ) : selectedDistrict ? (
        <DistrictDetail
          district={selectedDistrict}
          schools={schools}
          loadingSchools={loadingSchools}
          onBack={onBack}
          onSelectSchool={onSelectSchool}
        />
      ) : (
        <DistrictList districts={districts} onSelect={onSelectDistrict} />
      )}
    </aside>
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600" />
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-neutral-100 py-3 pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-neutral-50 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-600 transition active:scale-95 hover:bg-blue-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label}
    </button>
  );
}

function DistrictList({
  districts,
  onSelect,
}: {
  districts: District[];
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const valid = districts.filter((d) => d.id !== null);
  const filtered = valid.filter((d) => {
    const label = DISTRICT_GEO[d.name]?.shortName ?? d.name;
    return label.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-5">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Районы ({valid.length})
        </h2>
        <div className="mt-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Поиск района..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Ничего не найдено
            </p>
          ) : (
            filtered.map((d) => {
              const geo = DISTRICT_GEO[d.name];
              const color = geo?.color ?? "#3b82f6";
              return (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id!)}
                  className="group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl bg-neutral-50 p-4 text-left transition active:scale-[0.98] hover:bg-neutral-100"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl"
                    style={{
                      backgroundColor: color + "20",
                      border: `2px solid ${color}40`,
                    }}
                  >
                    <div className="flex h-full items-center justify-center">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium tracking-tight text-neutral-900">
                      {geo?.shortName ?? d.name}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                      {d.students != null && (
                        <span>{d.students.toLocaleString("ru")} уч.</span>
                      )}
                      {d.teachers != null && (
                        <span>{d.teachers.toLocaleString("ru")} пед.</span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function DistrictDetail({
  district,
  schools,
  loadingSchools,
  onBack,
  onSelectSchool,
}: {
  district: District;
  schools: School[];
  loadingSchools: boolean;
  onBack: () => void;
  onSelectSchool: (school: School) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q)),
  );

  const geo = DISTRICT_GEO[district.name];
  const color = geo?.color ?? "#3b82f6";

  return (
    <>
      <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-5">
        <BackButton onClick={onBack} label="Все районы" />

        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-xl"
            style={{
              backgroundColor: color + "20",
              border: `2px solid ${color}40`,
            }}
          >
            <div className="flex h-full items-center justify-center">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            {geo?.shortName ?? district.name}
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatCard
            label="Учеников"
            value={district.students}
            color="#3b82f6"
          />
          <StatCard
            label="Учителей"
            value={district.teachers}
            color="#8b5cf6"
          />
          <StatCard
            label="Работников"
            value={district.workers}
            color="#f59e0b"
          />
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            Школы{!loadingSchools && ` (${schools.length})`}
          </h3>
          {!loadingSchools && schools.length > 0 && (
            <div className="mt-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Поиск школы..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loadingSchools ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600" />
          </div>
        ) : schools.length === 0 ? (
          <p className="text-sm text-neutral-400">Школы не найдены</p>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                Ничего не найдено
              </p>
            ) : (
              filtered.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSelectSchool(s)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-neutral-50 p-3.5 text-left transition active:scale-[0.98] hover:bg-neutral-100"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 14l6.16-3.422A12.083 12.083 0 0119 14.5c0 3-3.5 5.5-7 5.5s-7-2.5-7-5.5a12.1 12.1 0 01.84-3.922L12 14z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tracking-tight text-neutral-900">
                      {s.name}
                    </p>
                    {s.address && (
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {s.address}
                      </p>
                    )}
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

function SchoolDetail({
  school,
  onBack,
}: {
  school: School;
  onBack: () => void;
}) {
  const siteUrl = school.site
    ? school.site.startsWith("http")
      ? school.site
      : `https://${school.site}`
    : null;

  return (
    <>
      <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-5">
        <BackButton onClick={onBack} label="К списку школ" />
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-neutral-900">
          {school.name}
        </h2>
        {school.is_state && (
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Государственная
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          {school.address && (
            <InfoCard
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              }
              icon2={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              }
              label="Адрес"
              value={school.address}
            />
          )}

          {siteUrl && (
            <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-neutral-400">Сайт</p>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block cursor-pointer truncate text-sm font-medium text-blue-600 hover:underline"
                >
                  {school.site}
                </a>
              </div>
            </div>
          )}

          {(school.shift != null || school.capacity != null) && (
            <div className="grid grid-cols-2 gap-2">
              {school.shift != null && (
                <MiniStat
                  label="Сменность"
                  value={`${school.shift}`}
                  color="#8b5cf6"
                />
              )}
              {school.capacity != null && (
                <MiniStat
                  label="Всего мест"
                  value={school.capacity.toLocaleString("ru")}
                  color="#f59e0b"
                />
              )}
            </div>
          )}

          {(school.students != null ||
            school.teachers != null ||
            school.workers != null) && (
            <div className="grid grid-cols-3 gap-2">
              {school.students != null && (
                <MiniStat
                  label="Учеников"
                  value={school.students.toLocaleString("ru")}
                  color="#3b82f6"
                />
              )}
              {school.teachers != null && (
                <MiniStat
                  label="Педагогов"
                  value={school.teachers.toLocaleString("ru")}
                  color="#8b5cf6"
                />
              )}
              {school.workers != null && (
                <MiniStat
                  label="Работников"
                  value={school.workers.toLocaleString("ru")}
                  color="#10b981"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-3 py-3 text-center">
      <p className="text-lg font-semibold tracking-tight" style={{ color }}>
        {value != null ? value.toLocaleString("ru") : "—"}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-neutral-400">{label}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-3 py-3 text-center">
      <p className="text-base font-semibold tracking-tight" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-neutral-400">{label}</p>
    </div>
  );
}

function InfoCard({
  icon,
  icon2,
  label,
  value,
}: {
  icon: React.ReactNode;
  icon2?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
          {icon2}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}
