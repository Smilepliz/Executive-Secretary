var _a;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// GitHub project pages: https://<user>.github.io/<repo>/
// В CI переменная GITHUB_REPOSITORY задаётся автоматически (owner/repo).
var repo = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split("/")[1];
var base = repo ? "/".concat(repo, "/") : "/";
export default defineConfig({
    base: base,
    plugins: [react()]
});
