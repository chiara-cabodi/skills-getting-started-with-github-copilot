import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activities_data

client = TestClient(app)
initial_activities = copy.deepcopy(activities_data)


def reset_activities():
    activities_data.clear()
    activities_data.update(copy.deepcopy(initial_activities))


@pytest.fixture(autouse=True)
def activity_fixture():
    reset_activities()
    yield
    reset_activities()


def test_root_redirects_to_static_index():
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_all_activities():
    response = client.get("/activities")

    assert response.status_code == 200
    assert response.json() == initial_activities


def test_signup_for_activity_adds_participant():
    activity_name = "Tennis Club"
    email = "maria@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities_data[activity_name]["participants"]


def test_signup_for_missing_activity_returns_404():
    response = client.post("/activities/Nonexistent/signup", params={"email": "test@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_duplicate_signup_returns_400():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"


def test_unregister_from_activity_removes_participant():
    activity_name = "Programming Class"
    email = "emma@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in activities_data[activity_name]["participants"]


def test_unregister_missing_activity_returns_404():
    response = client.delete("/activities/Nonexistent/participants", params={"email": "test@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_missing_participant_returns_404():
    activity_name = "Science Club"
    email = "nonmember@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
