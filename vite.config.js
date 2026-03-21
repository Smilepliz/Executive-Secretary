import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
// GitHub Pages: относительный base надёжнее абсолютного /Repo/ — ассеты резолвятся
// относительно index.html (нет 404 из‑за кэша старого HTML или регистра в URL).
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === "serve" ? "/" : "./",
        plugins: [react()],
        test: {
            environment: "node",
            include: ["src/**/*.test.ts"]
        }
    });
});
