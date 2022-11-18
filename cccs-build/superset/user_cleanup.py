import json
import os

import requests

msgraph_login_response = requests.post(
    f"https://login.microsoftonline.com/{os.getenv('SUPERSET_TENANT_ID')}/oauth2/v2.0/token",
    data={
        "client_id": os.getenv("SUPERSET_APPLICATION_ID"),
        "client_secret": os.getenv("AZURE_SECRET"),
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials",
    },
)
msgraph_token = msgraph_login_response.json()["access_token"]

login_data = {
    "provider": "db",
    "refresh": True,
    "username": "sa-usersync",
    "password": os.environ.get("SA_USERSYNC_PASSWORD"),
}

superset_base_api = f"https://{os.environ.get('SUPERSET_SERVICE_HOST')}:{os.environ.get('SUPERSET_SERVICE_PORT')}"

login_response = requests.post(
    f"{superset_base_api}/api/v1/security/login",
    json=login_data,
)
login_response.raise_for_status()

login_response_data = json.loads(login_response.content.decode("utf8", "replace"))
superset_token = login_response_data["access_token"]

users = requests.get(
    f"{superset_base_api}/api/v1/users",
    params={"q": json.dumps({"columns": ["id", "username"]})},
    headers={
        "Authorization": "Bearer " + superset_token,
        "Content-Type": "application/json",
    },
)

users_json = users.json()

if not users_json:
    exit(1)

users_array = users_json["result"]

if not users_array:
    exit(1)

usernames = [x["username"] for x in users_array]
ids = [x["id"] for x in users_array]
users_dict = dict(zip(usernames, ids))

deleted_users = []

for username, superset_id in users_dict.items():

    # Don't delete service accounts
    if str(username).startswith("sa-"):
        continue

    graph_user = requests.get(
        "https://graph.microsoft.com/v1.0/users/" + username,
        headers={
            "Authorization": "Bearer " + msgraph_token,
            "Content-Type": "application/json",
        },
    )

    if graph_user.status_code == 404:
        deleted_users.append(superset_id)

for deleted_user in deleted_users:
    requests.delete(
        f"{superset_base_api}/api/v1/users/{deleted_user}",
        headers={"Authorization": "Bearer " + superset_token},
    )
