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
					skipWaiting: true,
					clientsClaim: true,
					globPatterns: [
						"**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}",
					],
					navigateFallback: "index.html",
					navigateFallbackDenylist: [/^\/api\//],
					runtimeCaching: [
						{
							urlPattern: /^\/api\//,
							handler: "NetworkFirst",
							options: {
								cacheName: "api-cache",
								networkTimeoutSeconds: 5,
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 60 * 60 * 24,
								},
								cacheableResponse: { statuses: [0, 200] },
							},
						},
					],
				},
				manifest: {
					name: "Школы Чеченской Республики",
					short_name: "Школы ЧР",
					description: "Мониторинг школ Чеченской Республики",
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
