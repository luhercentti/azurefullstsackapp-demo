# tests/test_main.p
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from Azure Container Apps!"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_get_tasks():
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_task():
    task_data = {"title": "Test task", "completed": False}
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 200
    assert response.json()["title"] == "Test task"
    assert response.json()["completed"] == False

def test_update_task():
    # First create a task
    task_data = {"title": "Test task for update", "completed": False}
    create_response = client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Update the task
    update_data = {"completed": True}
    response = client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["completed"] == True

def test_delete_task():
    # First create a task
    task_data = {"title": "Test task for deletion", "completed": False}
    create_response = client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Delete the task
    response = client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    
    # Verify task is deleted by trying to update it
    update_response = client.put(f"/api/tasks/{task_id}", json={"completed": True})
    assert update_response.json() == {"error": "Task not found"}