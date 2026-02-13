import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
plugins: [
  react(),
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: "auto",
    manifest: {
      name: "Gestão ERP - Restaurante",
      short_name: "Gestão",
      description: "Sistema de Gestão para Restaurantes - ERP/PDV",
      theme_color: "#ffffff",
      icons: [
        {
          src: "/icons/icon-192.svg",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "/icons/icon-512.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ]
    }
  })
],
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
