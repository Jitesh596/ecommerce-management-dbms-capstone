import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on("error", (err, req, res) => {
                        if (res && !res.headersSent) {
                            res.writeHead(502, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Backend server not running on port 5000" }));
                        }
                    });
                }
            }
        }
    }
});
