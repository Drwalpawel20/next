import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const source = join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const target = join(process.cwd(), "public", "ort");
await mkdir(target, { recursive: true });
const files = (await readdir(source)).filter((name) => /^ort-wasm.*\.(wasm|mjs)$/.test(name));
if (!files.length) throw new Error("Nie znaleziono plików WASM ONNX Runtime Web.");
await Promise.all(files.map((name) => cp(join(source, name), join(target, name))));
console.log(`Skopiowano ${files.length} plików ONNX Runtime Web do public/ort.`);
