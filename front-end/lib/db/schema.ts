/**
 * SQLite Database Schema
 * Based on PatientState from types.ts
 */

export const createTablesSQL = `
-- Patients table (profile information)
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  diagnosis TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medications table (med_schedule)
CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  medication_name TEXT NOT NULL,
  schedule_time TEXT NOT NULL,
  last_taken DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Memory logs table (conversation history)
CREATE TABLE IF NOT EXISTS memory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'assistant', -- 'user' or 'assistant'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Health notes table
CREATE TABLE IF NOT EXISTS health_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Interactions table (tracks each agent interaction)
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  input TEXT NOT NULL,
  route_decision TEXT, -- 'task', 'health', 'memory'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_patient ON memory_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_patient ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_notes_patient ON health_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_interactions_patient ON interactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_created ON memory_logs(patient_id, created_at DESC);
`;

export const seedDataSQL = `
-- Insert default patient (Mary Thompson from patient.json)
INSERT OR IGNORE INTO patients (id, name, age, diagnosis)
VALUES (1, 'Mary Thompson', 76, 'Early-stage Alzheimer''s');

-- Insert medications
INSERT OR IGNORE INTO medications (id, patient_id, medication_name, schedule_time)
VALUES 
  (1, 1, 'Donepezil', '8am'),
  (2, 1, 'Memantine', '8pm');
`;

