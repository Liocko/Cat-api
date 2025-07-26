from locust import HttpUser, task, between

class CatServiceUser(HttpUser):
    wait_time = between(0.01, 0.1)  # интервал между запросами (регулируется в UI)

    @task
    def get_cat(self):
        self.client.get("/api/cat")

    @task
    def like_cat(self):
        # Получить случайного котика, а потом лайкнуть его по id
        response = self.client.get("/api/cat")
        if response.status_code == 200 and "id" in response.json():
            cat_id = response.json()["id"]
            self.client.post(f"/api/cat/{cat_id}/like")

    @task
    def get_top_cats(self):
        self.client.get("/api/cat/top")

    @task
    def get_history(self):
        self.client.get("/api/cat/history")