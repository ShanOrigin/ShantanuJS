import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const tarball = readdirSync(root).find((file) => /^shantanujs-.*\.tgz$/.test(file));

if (!tarball) throw new Error("Run npm run build before npm run check:package.");

const directory = mkdtempSync(join(tmpdir(), "shantanujs-package-check-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const tsc = join(root, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const options = { cwd: directory, stdio: "inherit" };

function check(name, command, args) {
  try {
    execFileSync(command, args, {
      ...options,
      shell: process.platform === "win32" && command.endsWith(".cmd"),
    });
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.message);
    return false;
  }
}

let success = false;

try {
  writeFileSync(join(directory, "package.json"), '{"private":true,"type":"commonjs"}');
  writeFileSync(join(directory, "index.ts"), `import { ShantanuJS } from "shantanujs";
const Canvas = ShantanuJS.Canvas;
const Rect = ShantanuJS.Shapes.Rect;
const Text = ShantanuJS.Media.Text;
let canvas!: ShantanuJS.Canvas;
let rect!: ShantanuJS.Shapes.Rect;
let text!: ShantanuJS.Media.Text;
void [Canvas, Rect, Text, canvas, rect, text];
`);
  writeFileSync(join(directory, "index.mjs"), 'globalThis.document = {}; await import("shantanujs");\n');
  writeFileSync(join(directory, "index.js"), 'globalThis.document = {}; import("shantanujs");\n');
  writeFileSync(join(directory, "index.cjs"), 'global.document = {}; require("shantanujs");\n');

  success =
    check("install packed package", npm, ["install", join(root, tarball), "--no-save", "--ignore-scripts", "--cache", join(directory, "npm-cache")]) &&
    check("TypeScript declarations", tsc, ["--noEmit", "--strict", "--target", "ES2020", "--lib", "DOM,ESNext", "--module", "ESNext", "--moduleResolution", "Bundler", "index.ts"]) &&
    check("ESM (.mjs)", process.execPath, ["index.mjs"]) &&
    check("JavaScript (.js)", process.execPath, ["index.js"]) &&
    check("CommonJS (.cjs)", process.execPath, ["index.cjs"]);
} finally {
  rmSync(directory, { recursive: true, force: true });
}

if (!success) process.exitCode = 1;
else console.log("PASS: packed package verification complete");
