import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub project pages: https://<user>.github.io/<repo>/
// В CI переменная GITHUB_REPOSITORY задаётся автоматически (owner/repo).
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = repo ? `/${repo}/` : "/";

export default defineConfig({
  base,
  plugins: [react()]
});
