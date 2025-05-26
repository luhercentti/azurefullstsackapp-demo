from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="Simple API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data
tasks = [
    {"id": 1, "title": "Learn FastAPI", "completed": False},
    {"id": 2, "title": "Deploy to Azure", "completed": False},
    {"id": 3, "title": "Create CI/CD pipeline", "completed": True},
]

class Task(BaseModel):
    title: str
    completed: bool = False

class TaskUpdate(BaseModel):
    title: str = None
    completed: bool = None

@app.get("/")
async def root():
    return {"message": "Hello from Azure Container Apps!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/tasks", response_model=List[dict])
async def get_tasks():
    return tasks

@app.post("/api/tasks")
async def create_task(task: Task):
    new_task = {
        "id": len(tasks) + 1,
        "title": task.title,
        "completed": task.completed
    }
    tasks.append(new_task)
    return new_task

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: int, task_update: TaskUpdate):
    for task in tasks:
        if task["id"] == task_id:
            if task_update.title is not None:
                task["title"] = task_update.title
            if task_update.completed is not None:
                task["completed"] = task_update.completed
            return task
    return {"error": "Task not found"}

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int):
    for i, task in enumerate(tasks):
        if task["id"] == task_id:
            deleted_task = tasks.pop(i)
            return deleted_task
    return {"error": "Task not found"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)