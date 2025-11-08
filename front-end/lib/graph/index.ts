/**
 * Multi-Agent Graph System for Dementia Care
 * 
 * Two separate workflows optimized for different users:
 * 
 * 1. PATIENT GRAPH (/dashboard)
 *    - Simplified, patient-friendly workflow
 *    - Memory Agent: Warm responses with photo memory context
 *    - Task Agent: Simple daily activity management
 *    - Focus: Memory recall, daily routines, emotional support
 * 
 * 2. CARETAKER GRAPH (/dashboard/caretaker)
 *    - Full multi-agent system for healthcare professionals
 *    - Memory Agent: Compassionate initial response
 *    - Supervisor Agent: Intelligent routing
 *    - Task Agent: Medication tracking, caretaker tasks
 *    - Health Agent: Symptom tracking with severity classification
 *    - Focus: Medical oversight, comprehensive care management
 */

export { patientGraph } from "./patient-graph";
export { caretakerGraph } from "./caretaker-graph";

// Default export for backward compatibility
export { caretakerGraph as default } from "./caretaker-graph";
