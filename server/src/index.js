import 'dotenv/config'; // ✅ Load .env first
import path from 'path';
import { fileURLToPath } from 'url';

import app from './app.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('✅ .env loaded from:', path.resolve(__dirname, '../.env'));

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('SMTP host from env:', process.env.SMTP_HOST);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
