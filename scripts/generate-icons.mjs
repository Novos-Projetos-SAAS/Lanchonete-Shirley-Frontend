import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); const source = path.join(root, "public", "icons", "icon-source.svg"); const target = path.join(root, "public", "icons");
await mkdir(target, { recursive: true });
await sharp(source).resize(192, 192).png().toFile(path.join(target, "icon-192.png"));
await sharp(source).resize(512, 512).png().toFile(path.join(target, "icon-512.png"));
await sharp(source).resize(410, 410).extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#ad3226" }).png().toFile(path.join(target, "icon-maskable-512.png"));
await sharp(source).resize(48, 48).png().toFile(path.join(target, "favicon-48.png"));
console.log("Ícones PWA gerados em public/icons.");

