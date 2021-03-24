#!/bin/bash

SOURCE_FILE=dashboards_export.json
DEST_FILE=telemetry_dashboard.yaml
DASHBOARDS="CCCS Telemetry"

echo "Exporting dashboards"
docker exec -it superset_app superset export-dashboards --dashboard-file /app/$SOURCE_FILE

echo "Copy exported dashboard outside docker container"
docker cp superset_app:/app/$SOURCE_FILE $SOURCE_FILE

echo "Extracting dashboards: $DASHBOARDS"
echo '{"dashboards":[' > $DEST_FILE
cat $SOURCE_FILE | jq ".dashboards | .[] | select(.__Dashboard__.dashboard_title == \"$DASHBOARDS\")" >> $DEST_FILE
echo '], "datasources":[' >> $DEST_FILE
echo "Extracting dashboards: $DATASOURCES"
cat $SOURCE_FILE | jq ".datasources | .[] | select(.__SqlaTable__.table_name == \"cccs_flow\")" >> $DEST_FILE
echo ',' >> $DEST_FILE
cat $SOURCE_FILE | jq ".datasources | .[] | select(.__SqlaTable__.table_name == \"cccs_http\")" >> $DEST_FILE
echo ',' >> $DEST_FILE
cat $SOURCE_FILE | jq ".datasources | .[] | select(.__SqlaTable__.table_name == \"cccs_aad\")" >> $DEST_FILE
echo ',' >> $DEST_FILE
cat $SOURCE_FILE | jq ".datasources | .[] | select(.__SqlaTable__.table_name == \"cccs_geo\")" >> $DEST_FILE
echo ']}' >> $DEST_FILE

rm $SOURCE_FILE

echo "Selected dashboards are saved in $DEST_FILE"
