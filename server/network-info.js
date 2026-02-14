import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('\n🌐 Network Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n📱 Access from mobile:`);
console.log(`   1. Make sure your mobile is on the same WiFi network`);
console.log(`   2. Open .env file and set:`);
console.log(`      VITE_API_URL="http://${localIP}:3001"`);
console.log(`   3. Restart the dev server (npm run dev)`);
console.log(`   4. Open on mobile: http://${localIP}:5173`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
