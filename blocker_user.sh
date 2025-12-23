#!/bin/bash

# Configuration
BASE_URL="http://localhost:8081"
EMAIL="blocker@example.com"
PASSWORD="password"
PERFORMANCE_ID="PF279865"
SCHEDULE_ID="1"

echo "1. Registering Blocker User..."
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Blocker\",
    \"phone\": \"010-9999-9999\"
  }"
echo -e "\n"

echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"userEmail\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Blocker Access Token Acquired"

echo -e "\n3. Taking Queue Slot..."
QUEUE_RESPONSE=$(curl -s -X POST "$BASE_URL/queue/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"performanceId\": \"$PERFORMANCE_ID\",
    \"scheduleId\": $SCHEDULE_ID
  }")

# Check if we got in directly (which we should, if it's the first one)
REQUIRES_QUEUE=$(echo $QUEUE_RESPONSE | grep -o '"requiresQueue":[^,]*' | cut -d':' -f2 | tr -d '[:space:]')
SESSION_ID=$(echo $QUEUE_RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)

if [ "$REQUIRES_QUEUE" = "false" ]; then
    echo "SUCCESS: Blocker User has occupied the active slot!"
    echo "Session ID: $SESSION_ID"
    echo "Now, any other user trying to enter 'PF279865' will be forced into the WAITING queue."
else
    echo "WARNING: Blocker User was put in queue? Something is wrong or queue was already full."
    echo $QUEUE_RESPONSE
fi
