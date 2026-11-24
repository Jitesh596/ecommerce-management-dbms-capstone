import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================================");
console.log("  🚀 Starting Fashionista Full-Stack (Backend + Frontend) ");
console.log("==========================================================");

const isWin = process.platform === "win32";

// 1. Launch Express Backend Server on Port 5000
console.log("📦 Starting Node.js / Express Backend (port 5000)...");
const backend = spawn(
    "node",
    ["server/server.js"],
    {
        cwd: __dirname,
        stdio: "inherit",
        shell: isWin
    }
);

backend.on("error", (err) => {
    console.error("❌ Failed to start backend server:", err);
});

// 2. Launch Vite Frontend Dev Server on Port 5173
console.log("⚡ Starting Vite Frontend Dev Server (port 5173)...");
const npxCmd = isWin ? "npx.cmd" : "npx";
const frontend = spawn(
    npxCmd,
    ["vite"],
    {
        cwd: __dirname,
        stdio: "inherit",
        shell: isWin
    }
);

frontend.on("error", (err) => {
    console.error("❌ Failed to start frontend Vite server:", err);
});

// Graceful cleanup on termination
const cleanup = () => {
    console.log("\n🛑 Stopping Fashionista development servers...");
    try {
        if (backend && !backend.killed) backend.kill("SIGTERM");
    } catch (e) {}
    try {
        if (frontend && !frontend.killed) frontend.kill("SIGTERM");
    } catch (e) {}
    process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
