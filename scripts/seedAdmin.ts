/**
 * One-off admin seed — replaces the old (insecure) "auto-create admin on
 * login" backdoor.
 *
 * Usage (loads .env.local automatically via tsx if you use --env-file, or set
 * the vars inline):
 *
 *   ADMIN_NAME=admin ADMIN_PASSWORD='choose-a-strong-password' \
 *     DB_URI='mongodb://127.0.0.1:27017/inventory-nextjs-antd' \
 *     npm run seed:admin
 *
 * It creates the named user with full permissions if it does not already exist.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/userModel";

async function main() {
  const dbUri = process.env.DB_URI;
  const name = process.env.ADMIN_NAME || "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!dbUri) throw new Error("DB_URI is not set");
  if (!password) throw new Error("ADMIN_PASSWORD is not set");

  await mongoose.connect(dbUri);

  const existing = await User.findOne({ name });
  if (existing) {
    console.log(`User "${name}" already exists — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  await User.create({
    name,
    password: hashed,
    newProduct: true,
    sold: true,
    returning: true,
    query: true,
    addUser: true,
  });

  console.log(`Admin user "${name}" created successfully.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
