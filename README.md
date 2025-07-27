# 🐱 Cat Service

Сервис для просмотра милых котиков с мониторингом и алертингом. Сохраняет историю просмотров и топ самых популярных котиков.

**API**: Использует [The Cat API](https://thecatapi.com/) для получения изображений котиков (лимит: 100 запросов).

## 📚 Содержание
- [Запуск проекта](#запуск-проекта)
- [Доступные адреса](#доступные-адреса)
- [Мониторинг](#мониторинг)
- [Тестирование](#тестирование)
- [Алерты](#алерты)

## 🚀 Запуск проекта

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd o11y
```

2. Запустите проект:
```bash
docker-compose up -d
```

Все зависимости и настройки окружения будут установлены автоматически через Docker.

## 🌐 Доступные адреса

- **Основной сервис**: http://localhost:3000
  - Главная страница с котиками
  - История просмотров
  - Топ популярных котиков

- **Swagger**: http://localhost:3000/api-docs
  - Документация API
  - Тестовые эндпоинты
  - Интерактивное тестирование API

- **Grafana**: http://localhost:3000/grafana
  - Дашборды с метриками
  - Логин: admin
  - Пароль: admin

- **Prometheus**: http://localhost:9090
  - Метрики
  - Алерты
  - PromQL запросы

- **Alertmanager**: http://localhost:9093
  - Управление алертами
  - История алертов

- **Locust**: http://localhost:8089
  - Нагрузочное тестирование
  - Графики в реальном времени

## 📊 Мониторинг

### Метрики
- HTTP запросы (latency, RPS)
- Операции с БД (RPS, длительность)
- Внешний API (latency, ошибки)
- Системные метрики (CPU, Memory)

### Дашборды
- **Cat Service Overview**: общая статистика сервиса
- **Database Metrics**: метрики базы данных
- **API Metrics**: метрики HTTP запросов

### Конфигурация
Все конфиги для графиков и алертов находятся в:
- `monitoring/prometheus.yml` - конфигурация Prometheus
- `monitoring/alert.rules.yml` - правила алертов
- `monitoring/alertmanager.yml` - настройки уведомлений
- `monitoring/grafana/provisioning/dashboards/` - дашборды Grafana

## 🧪 Тестирование

### Нагрузочное тестирование (Locust)

Для запуска Locust потребуется локально установленный Python. Используйте скрипт:
```bash
cd cat-service/load_test
./run_locust.sh
```

Или запустите вручную:
```bash
cd cat-service/load_test
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
locust -f locustfile.py --host http://localhost:3000
```

### Тестирование алертов

Для тестирования алертов используйте скрипт:
```bash
cd cat-service
node test_alerts.js
```

Скрипт тестирует все алерты **БЕЗ использования The Cat API** (чтобы не тратить лимит в 100 запросов):
1. **High DB RPS** (60 секунд) - через `/api/test/dbload`
2. **High API RPS** (60 секунд) - через `/api/test/latency`
3. **High Latency** (60 секунд) - через `/api/test/latency?ms=1000`
4. **5xx Errors** (60 секунд) - через `/api/test/error`

Между тестами делается пауза 30 секунд для разрешения алертов.

**Важно**: Скрипт не использует `/api/cat` эндпоинт, чтобы не тратить запросы к The Cat API.

## ⚠️ Алерты

Все алерты отправляются в Telegram канал [@CatApiAlerts](https://t.me/CatApiAlerts)

### Правила алертов:
- **CatServiceP99Latency**: P99 latency > 500ms
- **CatServiceHighDbRPS**: DB операций > 100 RPS
- **CatServiceHighApiRPS**: API запросов > 100 RPS
- **CatServiceHighDbSaveRPS**: DB сохранений > 80 RPS
- **CatServiceCatApiSlow**: P95 latency внешнего API > 1s
- **CatService5xxErrors**: Любые 5xx ошибки

### Как воспроизвести алерты:
1. **P99 Latency**: Запустите тест с высокой задержкой
   ```bash
   curl "http://localhost:3000/api/test/latency?ms=600"
   ```

2. **High DB RPS**: Запустите нагрузочный тест БД
   ```bash
   curl -X POST "http://localhost:3000/api/test/dbload?count=200"
   ```

Или используйте скрипт `test_alerts.js` для автоматического тестирования всех алертов.