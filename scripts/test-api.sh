#!/bin/bash

set -e

BASE_URL="${BASE_URL:-http://localhost:5173}"
TEST_EMAIL="test-api-$(date +%s)@example.com"
TEST_PASSWORD="testpassword123"
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================"
echo "API Test Script"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

check_server() {
    echo "Checking if server is running..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|404"; then
        echo "Server is reachable"
        return 0
    else
        echo "ERROR: Server not reachable at $BASE_URL"
        echo "Please start the dev server with: npm run dev"
        exit 1
    fi
}

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local url="${BASE_URL}${endpoint}"
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    eval $curl_cmd
}

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    local token=$6
    
    echo -n "Testing: $name ... "
    
    response=$(make_request "$method" "$endpoint" "$data" "$token")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "✓ PASS (HTTP $http_code)"
        ((TESTS_PASSED++))
    else
        echo "✗ FAIL (Expected $expected_status, got $http_code)"
        echo "  Response: $body"
        ((TESTS_FAILED++))
    fi
}

get_token() {
    echo ""
    echo "=== Getting auth token ==="
    
    echo "Signing in..."
    response=$(curl -s -X POST "$BASE_URL/api/auth/sign-in" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    http_code=$(echo $response | grep -o '"httpCode":[0-9]*' | cut -d: -f2 || echo "401")
    
    if [ "$http_code" = "null" ] || [ -z "$http_code" ]; then
        http_code=$(echo $response | tail -c 4)
    fi
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "null" ]; then
        echo "User doesn't exist, creating account..."
        
        response=$(curl -s -X POST "$BASE_URL/api/auth/sign-up" \
            -H 'Content-Type: application/json' \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\",\"username\":\"testuser\"}")
        
        http_code=$(echo $response | grep -o '"httpCode":[0-9]*' | cut -d: -f2 || echo "200")
        
        if [ "$http_code" = "null" ] || [ -z "$http_code" ]; then
            http_code="200"
        fi
        
        echo "Account created. Now signing in..."
        
        response=$(curl -s -X POST "$BASE_URL/api/auth/sign-in" \
            -H 'Content-Type: application/json' \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    fi
    
    token=$(echo $response | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        echo "Failed to get token. Response: $response"
        exit 1
    fi
    
    echo "Got token: ${token:0:20}..."
    echo "$token" > /tmp/api-test-token.txt
}

check_server

get_token
TOKEN=$(cat /tmp/api-test-token.txt)

echo ""
echo "=== Testing Public Endpoints ==="

test_endpoint "GET all movements" "GET" "/api/movements" "200"
test_endpoint "GET all routines" "GET" "/api/routines" "200"

echo ""
echo "=== Testing Authenticated Endpoints (Movements) ==="

test_endpoint "POST create movement" "POST" "/api/movements" "201" '{"name":"Test Movement","description":"Test description","type":"timed","defaultValue":30,"defaultUnit":"seconds","isBilateral":false}' "$TOKEN"

MOVEMENT_ID="test-movement-id"

response=$(make_request "GET" "/api/movements" "" "")
movements_json=$(echo $response | sed '$d')
MOVEMENT_ID=$(echo "$movements_json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$MOVEMENT_ID" ]; then
    test_endpoint "GET single movement" "GET" "/api/movements/$MOVEMENT_ID" "200" "" "$TOKEN"
    test_endpoint "PATCH update movement" "PATCH" "/api/movements/$MOVEMENT_ID" "200" '{"name":"Updated Movement"}' "$TOKEN"
    test_endpoint "DELETE movement" "DELETE" "/api/movements/$MOVEMENT_ID" "200" "" "$TOKEN"
fi

echo ""
echo "=== Testing Authenticated Endpoints (Routines) ==="

test_endpoint "POST create routine" "POST" "/api/routines" "201" '{"name":"Test Routine","description":"Test routine","restBetweenMovements":10,"restBetweenSets":30,"autoAdvance":true,"audioEnabled":true,"keepAwake":true,"movementsData":"[]"}' "$TOKEN"

response=$(make_request "GET" "/api/routines" "" "")
routines_json=$(echo $response | sed '$d')
ROUTINE_ID=$(echo "$routines_json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ROUTINE_ID" ]; then
    test_endpoint "GET single routine" "GET" "/api/routines/$ROUTINE_ID" "200" "" ""
    test_endpoint "PATCH update routine" "PATCH" "/api/routines/$ROUTINE_ID" "200" '{"name":"Updated Routine"}' "$TOKEN"
    test_endpoint "DELETE routine" "DELETE" "/api/routines/$ROUTINE_ID" "200" "" "$TOKEN"
fi

echo ""
echo "========================================"
echo "Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
echo "========================================"

rm -f /tmp/api-test-token.txt

if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi

exit 0
