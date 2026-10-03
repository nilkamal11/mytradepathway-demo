import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const base = "/mytradepathway-demo/";
export default defineConfig({
  base: "/mytradepathway-demo/",
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  build: { sourcemap: false },
  plugins: [
    {
      name: "public-demo-offline-shell",
      closeBundle() {
        const assets = readdirSync("dist/assets").map(
          (name) => base + "assets/" + name,
        );
        const files = [
          base,
          base + "index.html",
          base + "manifest.webmanifest",
          base + "icon.svg",
          ...assets,
        ];
        const revision = createHash("sha256")
          .update(readFileSync("dist/index.html"))
          .digest("hex")
          .slice(0, 16);
        writeFileSync(
          "dist/sw.js",
          `const CACHE='mtp-demo-shell-${revision}';const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mtp-demo-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!FILES.includes(u.pathname))return;e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(u.pathname))));});`,
        );
      },
    },
  ],
});
