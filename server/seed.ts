import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed");
      return;
    }

    console.log("Seeding database with demo users...");

    const demoUsers = [
      {
        username: "alice",
        displayName: "Alice",
        password: await hashPassword("password123"),
        mobile: "+1234567890",
        avatarUrl: null,
      },
      {
        username: "bob",
        displayName: "Bob",
        password: await hashPassword("password123"),
        mobile: "+1234567891",
        avatarUrl: null,
      },
      {
        username: "charlie",
        displayName: "Charlie",
        password: await hashPassword("password123"),
        mobile: "+1234567892",
        avatarUrl: null,
      },
    ];

    for (const user of demoUsers) {
      await storage.createUser(user);
    }

    console.log("✓ Seeded demo users: alice, bob, charlie (all with password: password123)");
  } catch (err) {
    console.error("Seed error:", err);
  }
}
