// Sprawdza, czy obok każdego model.json leżą wszystkie pliki wag (*.bin) z weightsManifest.
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const models = ["model", "gradcam/features", "gradcam/head"].map((p) => join("public/models/brain-tumor", p, "model.json"));
let missing = 0;
for (const file of models) {
  const dir = dirname(file);
  const manifest = JSON.parse(readFileSync(file, "utf8")).weightsManifest ?? [];
  const paths = manifest.flatMap((g) => g.paths);
  const bad = paths.filter((p) => !existsSync(join(dir, p)) || statSync(join(dir, p)).size === 0);
  if (bad.length) { missing += bad.length; console.warn(`✗ ${dir}: brakuje ${bad.length}/${paths.length} plików wag: ${bad.join(", ")}`); }
  else console.log(`✓ ${dir}: ${paths.length} plik(i) wag OK`);
}
if (missing) {
  console.warn("\nDemo /brain-tumor nie zadziała bez plików .bin. Skopiuj je z oryginalnego projektu (te same nazwy, obok model.json).");
  if (process.argv.includes("--strict")) process.exit(1);
}
