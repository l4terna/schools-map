import { useEffect, useState, useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
	id: number;
	type: ToastType;
	message: string;
}

const TTL = 4000;

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
	for (const l of listeners) l();
}

function add(type: ToastType, message: string): number {
	const id = nextId++;
	toasts = [...toasts, { id, type, message }];
	emit();
	return id;
}

export function dismissToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
	emit();
}

export const toast = {
	success: (message: string) => add("success", message),
	error: (message: string) => add("error", message),
	info: (message: string) => add("info", message),
};

function subscribe(cb: () => void) {
	listeners.add(cb);
	return () => {
		listeners.delete(cb);
	};
}

function getSnapshot() {
	return toasts;
}

function useToasts() {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const STYLES: Record<
	ToastType,
	{ ring: string; icon: string; iconPath: React.ReactNode }
> = {
	success: {
		ring: "ring-emerald-200 dark:ring-emerald-800",
		icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
		iconPath: (
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
		),
	},
	error: {
		ring: "ring-rose-200 dark:ring-rose-800",
		icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
		iconPath: (
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
		),
	},
	info: {
		ring: "ring-blue-200 dark:ring-blue-800",
		icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
		iconPath: (
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		),
	},
};

function ToastCard({ item }: { item: ToastItem }) {
	const [leaving, setLeaving] = useState(false);
	const style = STYLES[item.type];

	useEffect(() => {
		const hide = setTimeout(() => setLeaving(true), TTL);
		const remove = setTimeout(() => dismissToast(item.id), TTL + 250);
		return () => {
			clearTimeout(hide);
			clearTimeout(remove);
		};
	}, [item.id]);

	function close() {
		setLeaving(true);
		setTimeout(() => dismissToast(item.id), 200);
	}

	return (
		<div
			className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl bg-white dark:bg-neutral-800 px-4 py-3 shadow-lg ring-1 transition-all duration-200 ${style.ring} ${
				leaving ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
			}`}
		>
			<span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{style.iconPath}
				</svg>
			</span>
			<p className="min-w-0 flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
				{item.message}
			</p>
			<button
				onClick={close}
				className="shrink-0 rounded-lg p-0.5 text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
				aria-label="Закрыть"
			>
				<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
}

export function Toaster() {
	const items = useToasts();
	return (
		<div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:max-w-sm sm:items-end">
			{items.map((item) => (
				<ToastCard key={item.id} item={item} />
			))}
		</div>
	);
}
