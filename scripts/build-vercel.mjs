import { build } from "esbuild";
import { mkdir, rm, cp, writeFile } from "node:fs/promises";
const output = ".vercel/output";
const fn = `${output}/functions/render.func`;
await rm(output, { recursive: true, force: true });
await mkdir(fn, { recursive: true });
// All server imports and npm dependencies are bundled: no source imports at runtime.
await build({
  entryPoints: ["api/index.ts"], outfile: `${fn}/index.cjs`,
  bundle: true, platform: "node", format: "cjs", target: "node22",
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env": JSON.stringify(Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("VITE_")))),
  },
  footer: { js: "module.exports = module.exports.default;" },
});
await mkdir(`${fn}/dist`, { recursive: true });
await cp("dist/index.html", `${fn}/dist/index.html`);
await cp("dist", `${output}/static`, { recursive: true });
// The HTML template belongs to the function, not a static root that shadows SSR.
await rm(`${output}/static/index.html`);
await writeFile(`${fn}/.vc-config.json`, JSON.stringify({
  runtime: "nodejs22.x", handler: "index.cjs", launcherType: "Nodejs", maxDuration: 60,
}));
await writeFile(`${output}/config.json`, JSON.stringify({ version: 3, routes: [
  { src: "/index.html", status: 308, headers: { Location: "/" } },
  { handle: "filesystem" },
  { src: "/(.*)", dest: "/render" },
]}));
console.log("Vercel output ready: one self-contained Node function and static assets.");
