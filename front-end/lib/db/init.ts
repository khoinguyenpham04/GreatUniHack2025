/**
 * Database initialization script
 * Run this to create the database and seed initial data
 */

import { getDatabase, closeDatabase } from "./index";
import fs from "fs";
import path from "path";

export function initializeDatabase() {
  console.log("🗄️  Initializing SQLite database...");

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✓ Created data directory");
  }

  // Initialize database (creates tables and seeds data)
  const db = getDatabase();
  console.log("✓ Database initialized at:", path.join(dataDir, "patients.db"));

  // Verify setup
  const patients = db.prepare("SELECT COUNT(*) as count FROM patients").get() as { count: number };
  const medications = db.prepare("SELECT COUNT(*) as count FROM medications").get() as { count: number };

  console.log(`✓ Found ${patients.count} patient(s)`);
  console.log(`✓ Found ${medications.count} medication(s)`);

  return db;
}

// Run if called directly
if (require.main === module) {
  try {
    initializeDatabase();
    console.log("\n✅ Database initialization complete!");
    closeDatabase();
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

