#!/bin/bash

DASHBOARD_FILE=telemetry_dashboard.yaml

echo "Copying dashboard file into docker container"
docker cp $DASHBOARD_FILE superset_app:/app/$DASHBOARD_FILE

echo "Importing cccs dashboards"
docker exec -it superset_app superset import-dashboards --path /app/$DASHBOARD_FILE

