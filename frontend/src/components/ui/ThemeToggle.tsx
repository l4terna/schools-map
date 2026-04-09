import { useTheme } from "@/lib/useTheme";

export function ThemeToggle({ className = "" }: { className?: string }) {
	const { theme, toggle } = useTheme();
	const isDark = theme === "dark";

	return (
		<button
			onClick={toggle}
			className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 ${className}`}
			title={isDark ? "Светлая тема" : "Тёмная тема"}
		>
			{isDark ? (
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
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			) : (
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
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			)}
		</button>
	);
}
