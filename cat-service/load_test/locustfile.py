
from locust import HttpUser, task, between

class CatServiceUser(HttpUser):
    wait_time = between(0.01, 0.1)  # интервал между запросами (регулируется в UI)

    @task(3)
    def db_load(self):
        # Генерируем нагрузку на БД (не тратит лимит The Cat API)
        self.client.post("/api/test/dbload?count=20")

    @task(2)
    def api_latency(self):
        # Генерируем нагрузку на API (без внешнего API)
        self.client.get("/api/test/latency?ms=50")

    @task(1)
    def error_test(self):
        # Генерируем ошибки для алертов
        self.client.get("/api/test/error")