#!/bin/bash

# Configuration
BASE_URL="http://localhost:8081"
EMAIL="test@example.com"
PASSWORD="password"
PERFORMANCE_ID="PF279865"
SCHEDULE_ID="1"

echo "1. Registering user..."
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User\",
    \"phone\": \"010-1234-5678\"
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
echo "Access Token: $TOKEN"

if [ -z "$TOKEN" ]; then
    echo "Login failed. Attempting with different key structure..."
    # Fallback if json structure is different
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo -e "\n3. Checking Queue (Issuing Token)..."
QUEUE_RESPONSE=$(curl -s -X POST "$BASE_URL/queue/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"performanceId\": \"$PERFORMANCE_ID\",
    \"scheduleId\": $SCHEDULE_ID
  }")
echo $QUEUE_RESPONSE

# Extract sessionId as the token
QUEUE_TOKEN=$(echo $QUEUE_RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
REQUIRES_QUEUE=$(echo $QUEUE_RESPONSE | grep -o '"requiresQueue":[^,]*' | cut -d':' -f2 | tr -d '[:space:]')

echo "Queue Session ID: $QUEUE_TOKEN"
echo "Requires Queue: $REQUIRES_QUEUE"

if [ "$REQUIRES_QUEUE" = "false" ]; then
    echo "Direct Entry Allowed! No need to poll status."
    # Optionally verify status even for active token
    echo -e "\n4. Verifying Active Token Status..."
    curl -s -X GET "$BASE_URL/queue/status/$QUEUE_TOKEN" \
      -H "Authorization: Bearer $TOKEN" \
      -H "performanceId: $PERFORMANCE_ID"
else
    echo -e "\n4. Checking Queue Status..."
    if [ -n "$QUEUE_TOKEN" ]; then
        curl -s -X GET "$BASE_URL/queue/status/$QUEUE_TOKEN" \
          -H "Authorization: Bearer $TOKEN" \
          -H "performanceId: $PERFORMANCE_ID"
    else
        echo "Error: No session ID returned."
    fi
fi

echo -e "\n\nTest Complete."
