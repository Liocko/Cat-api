# Cat Service

Сервис для просмотра случайных картинок с котиками, лайков, истории и топа. Swagger included!

## Как запустить

### 1. Установите зависимости

```bash
npm install
```

### 2. Запустите сервер

```bash
node server.js
```

Или используйте команду:

```bash
npm start
```

Обе команды делают одно и то же: запускают сервер из файла `server.js`.

По умолчанию сервер стартует на порту 3000. Если порт занят, измените его в `server.js`.

### 3. Откройте сайт

Перейдите в браузере по адресу:

```
http://localhost:3000
```

### 4. Swagger-документация

Документация API доступна по адресу:

```
http://localhost:3000/docs
```

## Структура проекта

- `server.js` — основной сервер, API, Swagger
- `cat-db.js` — работа с SQLite: история, лайки, топ
- `public/index.html` — UI сайта
- `public/main.js` — обработчики событий, работа с API

## Основные команды

- `npm install` — установка зависимостей
- `npm start` — запуск сервера

## Зависимости
- express
- node-fetch
- sqlite3
- swagger-ui-express
- swagger-jsdoc

## Примечания
- Для работы требуется Node.js (рекомендуется >= 18)
- Для корректной работы с ES-модулями используйте Node.js >= 18 и убедитесь, что в `package.json` указан тип `module`
- Если возникнут ошибки с портом, убедитесь, что порт 3000 свободен

## Нагрузочное тестирование (Locust)

Для генерации нагрузки используется [Locust](https://locust.io/) с веб-интерфейсом.

### Вариант 1. Локальный запуск через pip

1. Перейдите в папку с нагрузочным тестом:

```bash
cd cat-service/load_test
```

2. Установите зависимости:

```bash
pip install -r requirements.txt
```

3. Запустите основной сервис (если ещё не запущен):

```bash
cd ../../cat-service
npm install
npm start
```

4. Запустите Locust:

```bash
cd ../load_test
locust -f locustfile.py --host http://localhost:3000
```

5. Откройте UI Locust в браузере:

```
http://localhost:8089
```

---

### Вариант 2. Запуск через Docker

1. Перейдите в папку с нагрузочным тестом:

```bash
cd cat-service/load_test
```

2. Соберите Docker-образ:

```bash
docker build -t cat-locust .
```

3. Запустите контейнер:

```bash
docker run --rm -p 8089:8089 cat-locust
```

4. Откройте UI Locust в браузере:

```
http://localhost:8089
```

**Примечание:**
- По умолчанию Locust шлёт GET-запросы на `/api/cats`. Если нужно тестировать другой endpoint — измените его в файле `cat-service/load_test/locustfile.py`.
- В процессе теста Locust покажет графики и статистику по задержкам, количеству запросов и ошибкам.
- Для Docker используется `host.docker.internal` для доступа к сервису на хосте (актуально для Mac/Windows).

---
