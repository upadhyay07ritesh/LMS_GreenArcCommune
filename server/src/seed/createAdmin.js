import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

dotenv.config();

async function run() {
  await connectDB();
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    process.exit(1);
  }
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({ name: 'Administrator', email, password, role: 'admin' });
    console.log('Admin user created:', email);
  } else {
    console.log('Admin user already exists:', email);
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
