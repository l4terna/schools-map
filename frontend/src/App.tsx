import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "@/store";
import { router } from "@/router";
import { usePrefetchData } from "@/lib/usePrefetchData";

function PrefetchGate({ children }: { children: React.ReactNode }) {
	usePrefetchData();
	return <>{children}</>;
}

export default function App() {
	return (
		<Provider store={store}>
			<PrefetchGate>
				<RouterProvider router={router} />
			</PrefetchGate>
		</Provider>
	);
}
