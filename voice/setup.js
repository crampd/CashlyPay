import { getDb } from "./db.js";

// Save call info when initiated
export async function saveCall({ number, name, prompt, first_message, call_sid, status = "initiated" }) {
  const db = await getDb();
  await db.run(
    `INSERT INTO calls (number, name, prompt, first_message, call_sid, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [number, name, prompt, first_message, call_sid, status]
  );
}

// Update call status and store dynamic variables (e.g. after webhook)
export async function updateCallStatus(call_sid, status, dynamic_variables = null) {
  const db = await getDb();
  await db.run(
    `UPDATE calls SET status = ?, dynamic_variables = ?, created_at = CURRENT_TIMESTAMP WHERE call_sid = ?`,
    [status, dynamic_variables ? JSON.stringify(dynamic_variables) : null, call_sid]
  );
}

// Save or update conversation topics for a number
export async function saveConversation(number, topics, call_sid) {
  const db = await getDb();
  const row = await db.get(`SELECT id FROM conversations WHERE number = ?`, [number]);
  if (row) {
    await db.run(
      `UPDATE conversations SET topics = ?, last_call_sid = ?, updated_at = CURRENT_TIMESTAMP WHERE number = ?`,
      [topics, call_sid, number]
    );
  } else {
    await db.run(
      `INSERT INTO conversations (number, topics, last_call_sid) VALUES (?, ?, ?)`,
      [number, topics, call_sid]
    );
  }
}

// Retrieve previous topics for a number
export async function getPreviousTopics(number) {
  const db = await getDb();
  const row = await db.get(`SELECT topics FROM conversations WHERE number = ?`, [number]);
  return row ? row.topics : null;
}