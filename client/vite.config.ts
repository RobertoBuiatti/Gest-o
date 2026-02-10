import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	css: {
		modules: {
			localsConvention: "camelCase",
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:3333",
				changeOrigin: true,
			},
			"/uploads": {
				target: "http://localhost:3333",
				changeOrigin: true,
			},
		},
	},
});
