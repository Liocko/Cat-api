import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cats (
      id SERIAL PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      likes INTEGER DEFAULT 0,
      shown INTEGER DEFAULT 0
    );
  `);
}

// Сохраняет котика по url, возвращает объект с id и url
export async function saveCat(url) {
  // Пытаемся вставить нового котика
  const insertResult = await pool.query(
    'INSERT INTO cats (url, shown) VALUES ($1, 1) ON CONFLICT (url) DO UPDATE SET shown = cats.shown + 1 RETURNING id, url, likes, shown',
    [url]
  );
  return insertResult.rows[0];
}

// Лайк по id
export async function likeCat(id) {
  await pool.query('UPDATE cats SET likes = likes + 1 WHERE id = $1', [id]);
}

// Топ котиков по лайкам
export async function getTopCats(limit = 5) {
  const result = await pool.query('SELECT id, url, likes FROM cats ORDER BY likes DESC, shown DESC LIMIT $1', [limit]);
  return result.rows;
}

// История просмотров (последние N котиков)
export async function getHistory(limit = 10) {
  const result = await pool.query('SELECT id, url, shown FROM cats ORDER BY id DESC LIMIT $1', [limit]);
  return result.rows;
}

// Получить котика по id
export async function getCatById(id) {
  const result = await pool.query('SELECT id, url, likes, shown FROM cats WHERE id = $1', [id]);
  return result.rows[0];
}

// Получить котика по url
export async function getCatByUrl(url) {
  const result = await pool.query('SELECT id, url, likes, shown FROM cats WHERE url = $1', [url]);
  return result.rows[0];
}
