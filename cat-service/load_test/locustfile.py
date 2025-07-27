

from locust import HttpUser, task, between

class CatServiceUser(HttpUser):
    wait_time = between(0.01, 0.05)  # минимальный wait_time для высокой нагрузки

    @task(5)
    def db_load(self):
        # Много коротких запросов для высокой RPS по БД
        self.client.post("/api/test/dbload?count=1")

    @task(3)
    def api_latency(self):
        # Много коротких запросов для нагрузки на сервис (без внешнего API)
        self.client.get("/api/test/latency?ms=100")

    @task(2)
    def error_test(self):
        # Генерируем ошибки для алертов
        self.client.get("/api/test/error")