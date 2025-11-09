import Database from "better-sqlite3";
import path from "path";
import { createTablesSQL, seedDataSQL } from "./schema";

let db: Database.Database | null = null;

/**
 * Get or create database instance
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "patients.db");
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Initialize schema
  db.exec(createTablesSQL);
  db.exec(seedDataSQL);

  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Patient database operations
 */
export const PatientDB = {
  /**
   * Get patient profile by ID
   */
  getProfile(patientId: number = 1) {
    const db = getDatabase();
    const patient = db
      .prepare("SELECT * FROM patients WHERE id = ?")
      .get(patientId);

    if (!patient) return null;

    // Get medications with new structure
    const medications = db
      .prepare(
        "SELECT medication_name, dosage, schedule_time, days_of_week, last_taken FROM medications WHERE patient_id = ?"
      )
      .all(patientId) as Array<{
      medication_name: string;
      dosage: string;
      schedule_time: string;
      days_of_week: string;
      last_taken: string | null;
    }>;

    return {
      id: (patient as any).id,
      name: (patient as any).name,
      age: (patient as any).age,
      diagnosis: (patient as any).diagnosis,
      medications: medications.map(
        (m) => `${m.medication_name} ${m.dosage} at ${m.schedule_time}`
      ),
      created_at: (patient as any).created_at,
    };
  },

  /**
   * Update patient profile
   */
  updateProfile(
    patientId: number,
    data: { name?: string; age?: number; diagnosis?: string }
  ) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (data.name) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.age) {
      fields.push("age = ?");
      values.push(data.age);
    }
    if (data.diagnosis) {
      fields.push("diagnosis = ?");
      values.push(data.diagnosis);
    }

    if (fields.length === 0) return;

    values.push(patientId);
    db.prepare(
      `UPDATE patients SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values);
  },
};

/**
 * Memory log database operations
 */
export const MemoryDB = {
  /**
   * Add memory log entry
   */
  add(patientId: number, content: string, role: "user" | "assistant" = "assistant") {
    const db = getDatabase();
    db.prepare(
      "INSERT INTO memory_logs (patient_id, content, role) VALUES (?, ?, ?)"
    ).run(patientId, content, role);
  },

  /**
   * Get recent memory logs
   */
  getRecent(patientId: number, limit: number = 10) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT content, role, created_at FROM memory_logs WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(patientId, limit) as Array<{
      content: string;
      role: string;
      created_at: string;
    }>;
  },

  /**
   * Get all memory logs
   */
  getAll(patientId: number) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT content, role, created_at FROM memory_logs WHERE patient_id = ? ORDER BY created_at ASC"
      )
      .all(patientId) as Array<{
      content: string;
      role: string;
      created_at: string;
    }>;
  },

  /**
   * Clear old memories (keep last N)
   */
  clearOld(patientId: number, keepLast: number = 50) {
    const db = getDatabase();
    db.prepare(
      `DELETE FROM memory_logs 
       WHERE patient_id = ? 
       AND id NOT IN (
         SELECT id FROM memory_logs 
         WHERE patient_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?
       )`
    ).run(patientId, patientId, keepLast);
  },
};

/**
 * Task database operations
 */
export const TaskDB = {
  /**
   * Create new task
   */
  create(patientId: number, description: string) {
    const db = getDatabase();
    const result = db
      .prepare("INSERT INTO tasks (patient_id, description) VALUES (?, ?)")
      .run(patientId, description);
    return result.lastInsertRowid;
  },

  /**
   * Get all tasks
   */
  getAll(patientId: number, includeCompleted: boolean = true) {
    const db = getDatabase();
    let query = "SELECT * FROM tasks WHERE patient_id = ?";
    if (!includeCompleted) {
      query += " AND completed = 0";
    }
    query += " ORDER BY created_at DESC";

    return db.prepare(query).all(patientId) as Array<{
      id: number;
      description: string;
      completed: number;
      completed_at: string | null;
      created_at: string;
    }>;
  },

  /**
   * Get active tasks
   */
  getActive(patientId: number) {
    return this.getAll(patientId, false);
  },

  /**
   * Complete task
   */
  complete(taskId: number) {
    const db = getDatabase();
    db.prepare(
      "UPDATE tasks SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(taskId);
  },

  /**
   * Delete task
   */
  delete(taskId: number) {
    const db = getDatabase();
    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  },

  /**
   * Toggle task completion
   */
  toggle(taskId: number) {
    const db = getDatabase();
    const task = db.prepare("SELECT completed FROM tasks WHERE id = ?").get(taskId) as { completed: number } | undefined;
    
    if (!task) return;

    if (task.completed) {
      db.prepare("UPDATE tasks SET completed = 0, completed_at = NULL WHERE id = ?").run(taskId);
    } else {
      this.complete(taskId);
    }
  },
};

/**
 * Health notes database operations
 */
export const HealthDB = {
  /**
   * Add health note
   */
  add(patientId: number, note: string, severity: "low" | "medium" | "high" = "low") {
    const db = getDatabase();
    const result = db
      .prepare("INSERT INTO health_notes (patient_id, note, severity) VALUES (?, ?, ?)")
      .run(patientId, note, severity);
    return result.lastInsertRowid;
  },

  /**
   * Get all health notes
   */
  getAll(patientId: number) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, note, severity, created_at FROM health_notes WHERE patient_id = ? ORDER BY created_at DESC"
      )
      .all(patientId) as Array<{
      id: number;
      note: string;
      severity: string;
      created_at: string;
    }>;
  },

  /**
   * Get recent health notes
   */
  getRecent(patientId: number, limit: number = 5) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, note, severity, created_at FROM health_notes WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(patientId, limit) as Array<{
      id: number;
      note: string;
      severity: string;
      created_at: string;
    }>;
  },

  /**
   * Delete health note
   */
  delete(noteId: number) {
    const db = getDatabase();
    db.prepare("DELETE FROM health_notes WHERE id = ?").run(noteId);
  },
};

/**
 * Medication database operations
 */
export const MedicationDB = {
  /**
   * Get all medications for patient
   */
  getAll(patientId: number) {
    const db = getDatabase();
    return db
      .prepare("SELECT * FROM medications WHERE patient_id = ? ORDER BY schedule_time")
      .all(patientId) as Array<{
      id: number;
      medication_name: string;
      dosage: string;
      schedule_time: string;
      days_of_week: string;
      last_taken: string | null;
    }>;
  },

  /**
   * Get medications for a specific day and time
   */
  getForDayAndTime(patientId: number, dayOfWeek: string, time?: string) {
    const db = getDatabase();
    let query = "SELECT * FROM medications WHERE patient_id = ? AND days_of_week LIKE ?";
    const params: any[] = [patientId, `%${dayOfWeek}%`];
    
    if (time) {
      query += " AND schedule_time = ?";
      params.push(time);
    }
    
    return db.prepare(query).all(...params) as Array<{
      id: number;
      medication_name: string;
      dosage: string;
      schedule_time: string;
      days_of_week: string;
      last_taken: string | null;
    }>;
  },

  /**
   * Update last taken time
   */
  updateLastTaken(medicationId: number) {
    const db = getDatabase();
    db.prepare("UPDATE medications SET last_taken = CURRENT_TIMESTAMP WHERE id = ?").run(medicationId);
  },

  /**
   * Update all medications taken time (for daily log)
   */
  updateAllTaken(patientId: number) {
    const db = getDatabase();
    db.prepare("UPDATE medications SET last_taken = CURRENT_TIMESTAMP WHERE patient_id = ?").run(patientId);
  },
};

/**
 * Interaction tracking
 */
export const InteractionDB = {
  /**
   * Log interaction
   */
  log(patientId: number, input: string, routeDecision?: string) {
    const db = getDatabase();
    db.prepare(
      "INSERT INTO interactions (patient_id, input, route_decision) VALUES (?, ?, ?)"
    ).run(patientId, input, routeDecision || null);
  },

  /**
   * Get interaction history
   */
  getHistory(patientId: number, limit: number = 50) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT input, route_decision, created_at FROM interactions WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(patientId, limit) as Array<{
      input: string;
      route_decision: string | null;
      created_at: string;
    }>;
  },
};

/**
 * Daily activities database operations
 */
export const DailyActivityDB = {
  /**
   * Get all active daily activities
   */
  getActive(patientId: number) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, activity, icon FROM daily_activities WHERE patient_id = ? AND is_active = 1 ORDER BY id"
      )
      .all(patientId) as Array<{
      id: number;
      activity: string;
      icon: string;
    }>;
  },

  /**
   * Add new activity
   */
  add(patientId: number, activity: string, icon: string = '📋') {
    const db = getDatabase();
    const result = db
      .prepare("INSERT INTO daily_activities (patient_id, activity, icon) VALUES (?, ?, ?)")
      .run(patientId, activity, icon);
    return result.lastInsertRowid;
  },

  /**
   * Toggle activity active status
   */
  toggleActive(activityId: number) {
    const db = getDatabase();
    db.prepare(
      "UPDATE daily_activities SET is_active = NOT is_active WHERE id = ?"
    ).run(activityId);
  },
};

/**
 * Health tips database operations
 */
export const HealthTipDB = {
  /**
   * Get all active health tips
   */
  getActive(patientId: number) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, tip, icon FROM health_tips WHERE patient_id = ? AND is_active = 1 ORDER BY id"
      )
      .all(patientId) as Array<{
      id: number;
      tip: string;
      icon: string;
    }>;
  },

  /**
   * Add new health tip
   */
  add(patientId: number, tip: string, icon: string = '💡') {
    const db = getDatabase();
    const result = db
      .prepare("INSERT INTO health_tips (patient_id, tip, icon) VALUES (?, ?, ?)")
      .run(patientId, tip, icon);
    return result.lastInsertRowid;
  },

  /**
   * Toggle tip active status
   */
  toggleActive(tipId: number) {
    const db = getDatabase();
    db.prepare(
      "UPDATE health_tips SET is_active = NOT is_active WHERE id = ?"
    ).run(tipId);
  },
};

/**
 * Memory photos database operations
 */
export const MemoryPhotoDB = {
  /**
   * Get all memory photos
   */
  getAll(patientId: number) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, photo_path, memory_description, created_at FROM memory_photos WHERE patient_id = ? ORDER BY created_at DESC"
      )
      .all(patientId) as Array<{
      id: number;
      photo_path: string;
      memory_description: string;
      created_at: string;
    }>;
  },

  /**
   * Add new memory photo
   */
  add(patientId: number, photoPath: string, memoryDescription: string) {
    const db = getDatabase();
    const result = db
      .prepare("INSERT INTO memory_photos (patient_id, photo_path, memory_description) VALUES (?, ?, ?)")
      .run(patientId, photoPath, memoryDescription);
    return result.lastInsertRowid;
  },

  /**
   * Get random memory photos for recall
   */
  getRandom(patientId: number, limit: number = 3) {
    const db = getDatabase();
    return db
      .prepare(
        "SELECT id, photo_path, memory_description FROM memory_photos WHERE patient_id = ? ORDER BY RANDOM() LIMIT ?"
      )
      .all(patientId, limit) as Array<{
      id: number;
      photo_path: string;
      memory_description: string;
    }>;
  },
};

/**
 * Get complete patient state (for LangGraph)
 */
export function getPatientState(patientId: number = 1) {
  const profile = PatientDB.getProfile(patientId);
  if (!profile) {
    throw new Error(`Patient ${patientId} not found`);
  }

  const memoryLogs = MemoryDB.getRecent(patientId, 10);
  const tasks = TaskDB.getActive(patientId);
  const healthNotes = HealthDB.getRecent(patientId, 10);

  return {
    name: profile.name,
    age: profile.age,
    diagnosis: profile.diagnosis,
    med_schedule: profile.medications,
    input: "",
    memoryLog: memoryLogs.map((m) => m.content),
    tasks: tasks.map((t) => t.description),
    healthNotes: healthNotes.map((h) => h.note),
    routeDecision: undefined as string | undefined,
  };
}

