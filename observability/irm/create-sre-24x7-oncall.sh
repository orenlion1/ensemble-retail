#!/usr/bin/env sh
set -eu

: "${GRAFANA_IRM_API_URL:=https://incident-prod-us-east-3.grafana.net/oncall}"
: "${GRAFANA_IRM_TOKEN:?Set GRAFANA_IRM_TOKEN with grafana-irm-app.schedules:write}"
: "${GRAFANA_STACK_URL:=https://orenlion.grafana.net}"

SCHEDULE_NAME="${SCHEDULE_NAME:-Ensemble-Grafana SRE 24x7}"
SHIFT_NAME="${SHIFT_NAME:-Ensemble-Grafana SRE 24x7}"
TIME_ZONE="${TIME_ZONE:-America/New_York}"
START_DATE="${START_DATE:-2026-05-31}"
START_TIME="${START_TIME:-00:00:00}"
DURATION_SECONDS="${DURATION_SECONDS:-86400}"
USER_ID="${USER_ID:-UGQ913U99XKYX}"
TEAM_ID="${TEAM_ID:-TWU2GNHZYST7U}"
SLACK_CHANNEL_ID="${SLACK_CHANNEL_ID:-C0B6UFESQR5}"

shift_payload="$(mktemp)"
schedule_payload="$(mktemp)"
slack_payload="$(mktemp)"
shift_response="$(mktemp)"
schedule_response="$(mktemp)"
slack_response="$(mktemp)"
trap 'rm -f "$shift_payload" "$schedule_payload" "$slack_payload" "$shift_response" "$schedule_response" "$slack_response"' EXIT

cat > "$shift_payload" <<EOF
{
  "name": "$SHIFT_NAME",
  "type": "recurrent_event",
  "team_id": "$TEAM_ID",
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
  "team_id": "$TEAM_ID",
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

SCHEDULE_ID="$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(j.id || '')" "$schedule_response")"

cat > "$slack_payload" <<EOF
{
  "slack": {
    "channel_id": "$SLACK_CHANNEL_ID"
  }
}
EOF

curl -sS -f \
  -X PATCH "$GRAFANA_IRM_API_URL/api/v1/schedules/$SCHEDULE_ID/" \
  -H "Authorization: Bearer $GRAFANA_IRM_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Grafana-URL: $GRAFANA_STACK_URL" \
  --data @"$slack_payload" \
  > "$slack_response"

node -e "
const fs = require('fs');
const shift = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const schedule = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const slackSchedule = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
console.log(JSON.stringify({
  schedule_id: schedule.id,
  schedule_name: schedule.name,
  shift_id: shift.id,
  shift_name: shift.name,
  user_id: '$USER_ID',
  team_id: '$TEAM_ID',
  slack_channel_id: slackSchedule.slack && slackSchedule.slack.channel_id,
  time_zone: '$TIME_ZONE',
  coverage: '24/7/365',
  daily_window: '${START_TIME}-${START_TIME}'
}, null, 2));
" "$shift_response" "$schedule_response" "$slack_response"
