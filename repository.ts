try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on env vars provided by the environment (e.g. `docker run -e`)
}

const { Pool } = require('pg');

export type Task = {
  id: number;
  title: string;
  done: boolean;
};

export type TaskFilters = {
  done?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

const db = new Pool({ connectionString: process.env.DATABASE_URL });

const SEED_TASKS = [
  { title: 'Task 1', done: false },
  { title: 'Task 2', done: true },
  { title: 'Task 3', done: false },
];

export async function init(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT,
      done BOOLEAN
    )
  `);

  const { rows } = await db.query('SELECT COUNT(*) AS count FROM tasks');
  if (Number(rows[0].count) === 0) {
    for (const task of SEED_TASKS) {
      await db.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [task.title, task.done]);
    }
  }
}

export async function listTasks(filters: TaskFilters): Promise<Task[]> {
  let sql = `SELECT * FROM tasks`;
  const { rows } = await db.query(sql);
  return rows;
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0];
}

export async function createTask(title: string): Promise<Task> {
  const { rows } = await db.query(`INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *`, [title]);
  return rows[0];
}

export async function updateTask(id: number, changes: { title: string; done: boolean }): Promise<Task | undefined> {
  const { rows } = await db.query(`UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *`, [changes.title, changes.done, id]);
  return rows[0];
}

export async function deleteTask(id: number): Promise<boolean> {
  const { rows } = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
  return rows.length > 0;
}

/*
export async function listTasks(filters: TaskFilters): Promise<Task[]> {
  let sql = `SELECT * FROM tasks WHERE 1=1`;
  
  const params: (string | number | boolean)[] = [];

  if (filters.done !== undefined) {
    params.push(filters.done);
    sql += ` AND done = $${params.length}`;
  }

  if (filters.search !== undefined) {
    const escaped = filters.search.toLowerCase().replace(/[\\%_]/g, '\\$&');
    params.push(`%${escaped}%`);
    sql += ` AND LOWER(title) LIKE $${params.length} ESCAPE '\\'`;
  }

  sql += ' ORDER BY id';

  if (filters.limit !== undefined) {
    params.push(filters.limit);
    sql += ` LIMIT $${params.length}`;
  }
  if (filters.offset !== undefined && filters.offset > 0) {
    params.push(filters.offset);
    sql += ` OFFSET $${params.length}`;
  }

  const { rows } = await db.query(sql, params);
  return rows;
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0];
}

export async function createTask(title: string): Promise<Task> {
  const { rows } = await db.query(
    `INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *`,
    [title]
  );
  return rows[0];
}

export async function updateTask(
  id: number,
  changes: { title: string; done: boolean }
): Promise<Task | undefined> {
  const { rows } = await db.query(
    `UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *`,
    [changes.title, changes.done, id]
  );
  return rows[0];
}

export async function deleteTask(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount > 0;
}
*/

export async function getStats(): Promise<{ total: number; done: number; open: number }> {
  const { rows } = await db.query(`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE done) AS done FROM tasks
  `);
  const total = Number(rows[0].total);
  const done = Number(rows[0].done);
  return { total, done, open: total - done };
}

export async function resetTasks(): Promise<Task[]> {
  await db.query('TRUNCATE tasks RESTART IDENTITY');
  for (const task of SEED_TASKS) {
    await db.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [task.title, task.done]);
  }
  const { rows } = await db.query('SELECT * FROM tasks ORDER BY id');
  return rows;
}