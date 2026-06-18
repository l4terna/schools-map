import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/store/api/schoolsApi";

export function AdminLoginPage() {
	const [login, setLogin] = useState("");
	const [password, setPassword] = useState("");
	const [loginError, setLoginError] = useState<string | null>(null);
	const [doLogin, { isLoading, error }] = useLoginMutation();
	const navigate = useNavigate();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoginError(null);

		try {
			await doLogin({ login, password }).unwrap();
			navigate("/admin");
		} catch (err) {
			setLoginError("Неверный логин или пароль");
			console.error(err);
		}
	}

	return (
		<div className="flex min-h-[60vh] items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm dark:shadow-neutral-900/30"
			>
				<h1 className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-100">
					Вход в панель
				</h1>

				<input
					type="text"
					placeholder="Логин"
					value={login}
					onChange={(e) => setLogin(e.target.value)}
					className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
					required
				/>

				<input
					type="password"
					placeholder="Пароль"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
					required
				/>

				{(loginError || error) && (
					<p className="text-center text-sm text-red-500">
						{loginError || "Неверный логин или пароль"}
					</p>
				)}

				<button
					type="submit"
					disabled={isLoading}
					className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? "Вход..." : "Войти"}
				</button>
			</form>
		</div>
	);
}
