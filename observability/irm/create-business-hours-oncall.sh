#!/usr/bin/env sh
set -eu

: "${GRAFANA_IRM_API_URL:=https://incident-prod-us-east-3.grafana.net/oncall}"
: "${GRAFANA_IRM_TOKEN:?Set GRAFANA_IRM_TOKEN with grafana-irm-app.schedules:write}"
: "${GRAFANA_STACK_URL:=https://orenlion.grafana.net}"

SCHEDULE_NAME="${SCHEDULE_NAME:-Ensemble-Grafana Business Hours}"
SHIFT_NAME="${SHIFT_NAME:-Ensemble-Grafana 9-5 Eastern}"
TIME_ZONE="${TIME_ZONE:-America/New_York}"
START_DATE="${START_DATE:-2026-05-25}"
START_TIME="${START_TIME:-09:00:00}"
DURATION_SECONDS="${DURATION_SECONDS:-28800}"
USER_ID="${USER_ID:-}"

if [ -z "$USER_ID" ]; then
  USER_ID="$(gcx irm oncall users current -o json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s); process.stdout.write(j.id || '')}catch(e){}})")"
fi

if [ -z "$USER_ID" ]; then
  USER_ID="$(curl -sS -f \
    -X GET "$GRAFANA_IRM_API_URL/api/v1/users/current/" \
    -H "Authorization: Bearer $GRAFANA_IRM_TOKEN" \
    -H "Content-Type: application/json" \
    -H "X-Grafana-URL: $GRAFANA_STACK_URL" \
    | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s); process.stdout.write(j.id || '')})")"
fi

if [ -z "$USER_ID" ]; then
  echo "Unable to resolve USER_ID. Set USER_ID to your Grafana IRM user id." >&2
  exit 1
fi

shift_payload="$(mktemp)"
schedule_payload="$(mktemp)"
shift_response="$(mktemp)"
schedule_response="$(mktemp)"
trap 'rm -f "$shift_payload" "$schedule_payload" "$shift_response" "$schedule_response"' EXIT

cat > "$shift_payload" <<EOF
{
  "name": "$SHIFT_NAME",
  "type": "recurrent_event",
  "team_id": null,
  "time_zone": "$TIME_ZONE",
  "level": 0,
  "start": "${START_DATE}T${START_TIME}",
  "duration": $DURATION_SECONDS,
  "frequency": "daily",
  "interval": 1,
  "week_start": "MO",
  "by_day": ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  "users": ["$USER_ID"]
}
EOF

curl -sS -f \
  -X POST "$GRAFANA_IRM_API_URL/api/v1/on_call_shifts/" \
  -H "Authorization: Bearer $GRAFANA_IRM_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Grafana-URL: $GRAFANA_STACK_URL" \
  --data @"$shift_payload" \
  > "$shift_response"

SHIFT_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(j.id || '')" "$shift_response")"

if [ -z "$SHIFT_ID" ]; then
  echo "Shift was created but no shift id was returned." >&2
  cat "$shift_response" >&2
  exit 1
fi

cat > "$schedule_payload" <<EOF
{
  "name": "$SCHEDULE_NAME",
  "type": "calendar",
  "team_id": null,
  "time_zone": "$TIME_ZONE",
  "shifts": ["$SHIFT_ID"],
  "enable_web_overrides": true
}
EOF

curl -sS -f \
  -X POST "$GRAFANA_IRM_API_URL/api/v1/schedules/" \
  -H "Authorization: Bearer $GRAFANA_IRM_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Grafana-URL: $GRAFANA_STACK_URL" \
  --data @"$schedule_payload" \
  > "$schedule_response"

node -e "
const fs = require('fs');
const shift = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const schedule = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify({
  schedule_id: schedule.id,
  schedule_name: schedule.name,
  shift_id: shift.id,
  shift_name: shift.name,
  user_id: process.env.USER_ID || '$USER_ID',
  time_zone: '$TIME_ZONE',
  daily_window: '${START_TIME}-17:00:00'
}, null, 2));
" "$shift_response" "$schedule_response"
