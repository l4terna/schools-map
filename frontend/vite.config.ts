import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const apiTarget = env.VITE_API || "http://127.0.0.1:8000";

	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: "autoUpdate",
				workbox: {
					globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
					runtimeCaching: [
						{
							urlPattern: /\/api\/data\/version$/,
							handler: "NetworkFirst",
							options: {
								cacheName: "data-version",
								networkTimeoutSeconds: 3,
							},
						},
						{
							urlPattern: /\/api\/data\/all$/,
							handler: "NetworkFirst",
							options: {
								cacheName: "data-all",
								networkTimeoutSeconds: 10,
							},
						},
						{
							urlPattern: /\/api\/districts/,
							handler: "NetworkFirst",
							options: {
								cacheName: "api-districts",
								networkTimeoutSeconds: 5,
							},
						},
					],
				},
				manifest: {
					name: "Карта школ",
					short_name: "Школы",
					description: "Карта школ Чеченской Республики",
					theme_color: "#1e3a5f",
					background_color: "#ffffff",
					display: "standalone",
					start_url: "/",
					icons: [
						{
							src: "/pwa-192x192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "/pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
						},
						{
							src: "/pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "maskable",
						},
					],
				},
			}),
		],
		resolve: {
			alias: {
				"@": resolve(__dirname, "src"),
			},
		},
		server: {
			port: 5173,
			allowedHosts: true,
			proxy: {
				"/api": {
					target: apiTarget,
					changeOrigin: true,
				},
			},
		},
	};
});
