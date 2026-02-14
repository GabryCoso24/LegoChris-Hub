import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
const dbPath = path.join(__dirname, "data.json");
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, { team: [], staff: [], products: [], playlists: [], videos: [], newsletter: [] });

await db.read();

console.log("🔧 Pulizia URL nel database...\n");

let changes = 0;

// Clean team avatars
if (db.data.team) {
  db.data.team = db.data.team.map(item => {
    if (item.avatar && item.avatar.startsWith('http://localhost:3001')) {
      const cleaned = item.avatar.replace('http://localhost:3001', '');
      console.log(`✓ Team: ${item.name} - ${item.avatar} → ${cleaned}`);
      changes++;
      return { ...item, avatar: cleaned };
    }
    return item;
  });
}

// Clean staff avatars
if (db.data.staff) {
  db.data.staff = db.data.staff.map(item => {
    if (item.avatar && item.avatar.startsWith('http://localhost:3001')) {
      const cleaned = item.avatar.replace('http://localhost:3001', '');
      console.log(`✓ Staff: ${item.name} - ${item.avatar} → ${cleaned}`);
      changes++;
      return { ...item, avatar: cleaned };
    }
    return item;
  });
}

// Clean product images
if (db.data.products) {
  db.data.products = db.data.products.map(item => {
    if (item.image && item.image.startsWith('http://localhost:3001')) {
      const cleaned = item.image.replace('http://localhost:3001', '');
      console.log(`✓ Product: ${item.title} - ${item.image} → ${cleaned}`);
      changes++;
      return { ...item, image: cleaned };
    }
    return item;
  });
}

// Clean playlist thumbnails
if (db.data.playlists) {
  db.data.playlists = db.data.playlists.map(item => {
    if (item.thumbnail && item.thumbnail.startsWith('http://localhost:3001')) {
      const cleaned = item.thumbnail.replace('http://localhost:3001', '');
      console.log(`✓ Playlist: ${item.title} - ${item.thumbnail} → ${cleaned}`);
      changes++;
      return { ...item, thumbnail: cleaned };
    }
    return item;
  });
}

// Clean video thumbnails
if (db.data.videos) {
  db.data.videos = db.data.videos.map(item => {
    if (item.thumbnail && item.thumbnail.startsWith('http://localhost:3001')) {
      const cleaned = item.thumbnail.replace('http://localhost:3001', '');
      console.log(`✓ Video: ${item.title} - ${item.thumbnail} → ${cleaned}`);
      changes++;
      return { ...item, thumbnail: cleaned };
    }
    return item;
  });
}

await db.write();

console.log(`\n✅ Pulizia completata! ${changes} URL corretti.\n`);
console.log("Riavvia il backend e il frontend per applicare le modifiche.");
