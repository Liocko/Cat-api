# Экспорт бизнес-метрик для Prometheus и Grafana

## Как это работает

- Метрика RPS: `http_requests_total`
- Метрика latency: `http_request_duration_seconds`
- Метрика ошибок: `http_requests_total` с фильтром по коду ответа (например, 5xx)

## Пример Prometheus-запросов для Grafana

- **RPS по ручкам:**
  ```
  sum(rate(http_requests_total[1m])) by (route)
  ```
- **Latency (95-й перцентиль):**
  ```
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
  ```
- **Ошибки (5xx):**
  ```
  sum(rate(http_requests_total{code=~"5.."}[1m])) by (route)
  ```

---

## Готовый Grafana dashboard (импортируйте через Dashboards → Import → Upload JSON)

```json
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "iteration": 1620000000000,
  "panels": [
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
      "id": 1,
      "title": "RPS по ручкам",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[1m])) by (route)",
          "interval": "",
          "legendFormat": "{{route}}",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
      "id": 2,
      "title": "Latency 95% (сек) по ручкам",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))",
          "interval": "",
          "legendFormat": "{{route}}",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
      "id": 3,
      "title": "Ошибки 5xx по ручкам",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{code=~\"5..\"}[1m])) by (route)",
          "interval": "",
          "legendFormat": "{{route}}",
          "refId": "A"
        }
      ]
    }
  ],
  "schemaVersion": 37,
  "style": "dark",
  "tags": ["nodejs", "prometheus", "business-metrics"],
  "templating": {"list": []},
  "time": {"from": "now-1h", "to": "now"},
  "timepicker": {},
  "timezone": "browser",
  "title": "Node.js Business Metrics (RPS, Latency, Errors)",
  "uid": "cat-service-business-metrics",
  "version": 1
}
```

---
**Инструкция:**
1. Скопируйте JSON выше в файл, например, `cat-service-business-metrics.json`.
2. В Grafana: Dashboards → Import → Upload JSON → выберите этот файл.
3. Выберите ваш Prometheus datasource.
4. Наслаждайтесь графиками RPS, latency и ошибок по ручкам! 