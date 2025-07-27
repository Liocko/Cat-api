import express from 'express';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import { initDb, saveCat, likeCat, getTopCats, getHistory, getCatById, getCatByUrl, setDbMetrics } from './cat-db.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import client from 'prom-client';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const PORT = 3000;
app.use(express.json());

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Cat API',
    version: '1.0.0',
    description: 'API для работы с котиками: случайный котик, лайки, история, топ.'
  },
  servers: [{ url: 'http://localhost:3000' }],
};
const swaggerOptions = {
  swaggerDefinition,
  apis: ['./cat-server.js'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// --- METRICS ---
const register = client.register;
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

// Метрики для операций с БД
const dbOperationsTotal = new client.Counter({
  name: 'db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table']
});

const dbOperationDurationSeconds = new client.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

// Инициализация БД
initDb();

// Передаем метрики в БД модуль
setDbMetrics({
  dbOperationsTotal,
  dbOperationDurationSeconds
});
// Middleware для сбора метрик (ДОЛЖЕН БЫТЬ ДО ВСЕХ РОУТОВ)
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
});

// --- API ROUTES ---

/**
 * @swagger
 * /api/test/alerts:
 *   post:
 *     summary: Запустить нагрузочный тест для проверки алертов (test_alerts.js)
 *     responses:
 *       200:
 *         description: Тест запущен, алерты должны сработать в течение нескольких минут
 */
app.post('/api/test/alerts', (req, res) => {
  const fs = require('fs');
  const testAlertsPath = path.join(__dirname, 'test_alerts.js');
  
  // Проверяем существование файла
  if (!fs.existsSync(testAlertsPath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'test_alerts.js not found',
      message: 'Файл test_alerts.js не найден в директории cat-service'
    });
  }
  
  exec('node test_alerts.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message, 
        stderr,
        message: 'Ошибка при запуске теста алертов'
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Alert test started', 
        stdout,
        info: 'Тест алертов запущен. Проверьте Grafana и Alertmanager для просмотра результатов.'
      });
    }
  });
});
/**
 * @swagger
 * /api/cat:
 *   get:
 *     summary: Получить случайного котика
 *     responses:
 *       200:
 *         description: Случайная картинка котика
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 url:
 *                   type: string
 *                 likes:
 *                   type: integer
 *                 shown:
 *                   type: integer
 */
app.get('/api/cat', async (req, res) => {
  try {
    const response = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await response.json();
    if (data && data[0] && data[0].url) {
      const cat = await saveCat(data[0].url);
      res.json(cat);
    } else {
      res.status(500).json({ error: 'Не удалось получить картинку.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении картинки.' });
  }
});

/**
 * @swagger
 * /api/cat/{id}/like:
 *   post:
 *     summary: Поставить лайк котику по id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Лайк поставлен
 */
app.post('/api/cat/:id/like', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Нет id котика' });
  await likeCat(id);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/cat/top:
 *   get:
 *     summary: Получить топ котиков по лайкам
 *     responses:
 *       200:
 *         description: Топ котиков
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   url:
 *                     type: string
 *                   likes:
 *                     type: integer
 */
app.get('/api/cat/top', async (req, res) => {
  const top = await getTopCats();
  res.json(top);
});

/**
 * @swagger
 * /api/cat/history:
 *   get:
 *     summary: Получить историю показов котиков
 *     responses:
 *       200:
 *         description: История котиков
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   url:
 *                     type: string
 *                   shown:
 *                     type: integer
 */
app.get('/api/cat/history', async (req, res) => {
  const history = await getHistory();
  res.json(history);
});

/**
 * @swagger
 * /api/cat/{id}:
 *   get:
 *     summary: Получить котика по id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Котик
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 url:
 *                   type: string
 *                 likes:
 *                   type: integer
 *                 shown:
 *                   type: integer
 */
app.get('/api/cat/:id', async (req, res) => {
  const { id } = req.params;
  const cat = await getCatById(id);
  if (!cat) return res.status(404).json({ error: 'Котик не найден' });
  res.json(cat);
});

/**
 * @swagger
 * /api/test/dbload:
 *   post:
 *     summary: Сгенерировать нагрузку на БД (много операций)
 *     parameters:
 *       - in: query
 *         name: count
 *         required: false
 *         schema:
 *           type: integer
 *         description: Сколько операций выполнить (по умолчанию 200)
 *     responses:
 *       200:
 *         description: Количество выполненных операций
 */
app.post('/api/test/dbload', async (req, res) => {
  const count = parseInt(req.query.count) || 200;
  // Параллельно сохраняем котиков для высокой нагрузки
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(saveCat(`https://test/cat/${Date.now()}_${i}`));
  }
  const results = await Promise.all(promises);
  const lastId = results.length > 0 ? results[results.length - 1].id : null;
  res.json({ success: true, operations: count, lastId });
});

/**
 * @swagger
 * /api/test/latency:
 *   get:
 *     summary: Сгенерировать искусственную задержку ответа
 *     parameters:
 *       - in: query
 *         name: ms
 *         required: false
 *         schema:
 *           type: integer
 *         description: Задержка в миллисекундах (по умолчанию 600)
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/api/test/latency', async (req, res) => {
  const ms = parseInt(req.query.ms) || 600;
  await new Promise(resolve => setTimeout(resolve, ms));
  res.json({ success: true, latency: ms });
});

/**
 * @swagger
 * /api/test/error:
 *   get:
 *     summary: Сгенерировать искусственную 500 ошибку
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/api/test/error', (req, res) => {
  res.status(500).json({ error: 'Test error for alert monitoring' });
});

// --- METRICS ENDPOINT ---
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/test500', (req, res) => {
  res.status(500).json({ error: 'Моковая 500 ошибка для теста алертов' });
});

app.get('/api/test500x20', (req, res) => {
  let sent = 0;
  function send500() {
    res.write(JSON.stringify({ error: 'Моковая 500 ошибка для теста алертов', n: sent + 1 }) + '\n');
    sent++;
    if (sent < 20) {
      setTimeout(send500, 30); // чуть-чуть задержки для метрик
    } else {
      res.end();
    }
  }
  res.status(500);
  send500();
});

app.listen(PORT, () => {
  console.log(`Сервис котиков запущен на http://localhost:${PORT}`);
});
