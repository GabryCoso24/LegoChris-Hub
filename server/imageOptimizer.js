import fs from "fs";
import path from "path";

// sharp viene caricato al primo utilizzo: se non fosse installato (es. manca `npm install` sul
// server) l'API parte comunque e solo upload/conversione restituiscono un errore esplicito.
let sharpPromise;
function loadSharp() {
  sharpPromise ||= import("sharp").then((m) => m.default);
  return sharpPromise;
}

// Impostazioni di conversione (sovrascrivibili da .env)
export const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY || 82);
export const MAX_IMAGE_DIMENSION = Number(process.env.IMAGE_MAX_DIMENSION || 2560);

// Estensioni raster che vengono convertite in WebP (.webp e .svg restano invariati)
const CONVERTIBLE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".avif"]);

// Riconosce i riferimenti "/uploads/<nome>.<ext legacy>" dentro una stringa qualsiasi
const LEGACY_UPLOAD_URL_RE = /(\/uploads\/)([A-Za-z0-9._-]+)\.(png|jpe?g|gif|bmp|tiff?|avif)(?![A-Za-z0-9])/gi;

/**
 * Converte un'immagine (qualsiasi formato supportato da sharp) in WebP.
 * - corregge l'orientamento EXIF e poi rimuove i metadati (peso e privacy)
 * - ridimensiona solo se supera MAX_IMAGE_DIMENSION (mai ingrandisce)
 * - mantiene la trasparenza e le animazioni (GIF -> WebP animato)
 * - per i PNG prova anche la compressione lossless e tiene la versione più leggera
 */
export async function toWebpBuffer(input) {
  const sharp = await loadSharp();
  const source = sharp(input, { animated: true, limitInputPixels: 100e6 });
  const meta = await source.metadata();

  const base = source
    .clone()
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  let buffer = await base.clone().webp({ quality: WEBP_QUALITY, effort: 5 }).toBuffer();

  const isAnimated = (meta.pages || 1) > 1;
  if (meta.format === "png" && !isAnimated) {
    const lossless = await base.clone().webp({ lossless: true, effort: 5 }).toBuffer();
    if (lossless.length < buffer.length) buffer = lossless;
  }

  return { buffer, sourceFormat: meta.format };
}

async function exists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converte in WebP tutte le immagini raster presenti in `uploadsDir`.
 * Gli originali NON vengono cancellati: sono spostati in `backupDir`
 * (fuori dalla cartella servita pubblicamente). Operazione idempotente.
 */
export async function migrateUploadsToWebp({ uploadsDir, backupDir, logger = console }) {
  const result = { converted: 0, failed: [], bytesBefore: 0, bytesAfter: 0 };

  const names = await fs.promises.readdir(uploadsDir);
  const todo = names.filter((n) => CONVERTIBLE_EXTENSIONS.has(path.extname(n).toLowerCase()));
  if (todo.length === 0) return result;

  await fs.promises.mkdir(backupDir, { recursive: true });
  logger.log(`🖼️  Conversione WebP: ${todo.length} immagini da convertire...`);

  for (const name of todo) {
    const srcPath = path.join(uploadsDir, name);
    const destPath = path.join(uploadsDir, `${path.parse(name).name}.webp`);
    const tmpPath = `${destPath}.tmp`;

    try {
      const originalSize = (await fs.promises.stat(srcPath)).size;

      if (!(await exists(destPath))) {
        const { buffer } = await toWebpBuffer(await fs.promises.readFile(srcPath));
        await fs.promises.writeFile(tmpPath, buffer);
        await fs.promises.rename(tmpPath, destPath);
      }

      const newSize = (await fs.promises.stat(destPath)).size;
      await fs.promises.rename(srcPath, path.join(backupDir, name));

      result.converted += 1;
      result.bytesBefore += originalSize;
      result.bytesAfter += newSize;
    } catch (err) {
      await fs.promises.rm(tmpPath, { force: true }).catch(() => {});
      result.failed.push({ name, error: err.message });
      logger.warn(`⚠️  Conversione fallita per ${name}: ${err.message}`);
    }
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  logger.log(
    `✅ Conversione WebP completata: ${result.converted} convertite, ${result.failed.length} fallite ` +
      `(${mb(result.bytesBefore)} MB → ${mb(result.bytesAfter)} MB). Originali in: ${backupDir}`
  );
  return result;
}

/**
 * Aggiorna (in place) gli URL "/uploads/xxx.png|jpg|..." di una struttura dati
 * (es. il database) in "/uploads/xxx.webp", ma solo se il file WebP esiste
 * davvero e quello originale non c'è più. Restituisce il numero di URL modificati.
 */
export function rewriteLegacyImageUrls(root, uploadsDir) {
  let changes = 0;

  const rewriteString = (value) =>
    value.replace(LEGACY_UPLOAD_URL_RE, (match, prefix, name, ext) => {
      const webpExists = fs.existsSync(path.join(uploadsDir, `${name}.webp`));
      const originalExists = fs.existsSync(path.join(uploadsDir, `${name}.${ext}`));
      if (!webpExists || originalExists) return match;
      changes += 1;
      return `${prefix}${name}.webp`;
    });

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (typeof item === "string") node[i] = rewriteString(item);
        else walk(item);
      });
    } else if (node && typeof node === "object") {
      for (const key of Object.keys(node)) {
        if (typeof node[key] === "string") node[key] = rewriteString(node[key]);
        else walk(node[key]);
      }
    }
  };

  walk(root);
  return changes;
}
