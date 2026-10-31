// Converte in WebP tutte le immagini già presenti in uploads/ e aggiorna gli URL in data.json.
// Uso: npm run migrate:images   (parte comunque in automatico all'avvio del server)
// Gli originali vengono spostati in server/uploads-originals/ (puoi cancellarli quando vuoi).
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import { migrateUploadsToWebp, rewriteLegacyImageUrls } from "./imageOptimizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "uploads");
const backupDir = path.join(__dirname, "uploads-originals");

await migrateUploadsToWebp({ uploadsDir, backupDir });

const db = new Low(new JSONFile(path.join(__dirname, "data.json")), {});
await db.read();
const rewritten = rewriteLegacyImageUrls(db.data, uploadsDir);
if (rewritten > 0) await db.write();
console.log(`🔗 URL aggiornati nel database: ${rewritten}`);
