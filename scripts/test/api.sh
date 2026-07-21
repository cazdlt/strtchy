#!/bin/bash

set -e

BASE_URL="${BASE_URL:-http://localhost:5173}"
API_KEY="${API_KEY:-}"
CREATE_USER="${CREATE_USER:-false}"
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================"
echo "API Test Script"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# Help text
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --create-user    Create a new test user and use its API key"
    echo "  --api-key KEY    Use a specific API key"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_KEY          API key to use for authentication"
    echo "  BASE_URL         Base URL of the API (default: http://localhost:5173)"
    echo ""
    echo "Examples:"
    echo "  $0 --create-user                    # Create test user and run tests"
    echo "  $0 --api-key strtchy_xxx...         # Use existing API key"
    echo "  API_KEY=strtchy_xxx... $0           # Use env var"
    exit 0
fi

# Parse arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --create-user)
            CREATE_USER="true"
            shift
            ;;
        --api-key)
            API_KEY="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

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
    
    # Build curl command without eval to avoid escaping issues
    local headers=()
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    headers+=(-H "Content-Type: application/json")
    
    # Make request and output body followed by status code on separate lines
    local body_file=$(mktemp)
    local http_code
    http_code=$(curl -s -o "$body_file" -w "%{http_code}" "${headers[@]}" -X "$method" ${data:+-d "$data"} "$url")
    cat "$body_file"
    echo ""
    echo "$http_code"
    rm -f "$body_file"
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
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL (Expected $expected_status, got $http_code)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

create_test_user() {
    echo ""
    echo "=== Creating test user ==="
    
    TEST_EMAIL="test-api-$(date +%s)@example.com"
    TEST_PASSWORD="testpassword123"
    TEST_USERNAME="testuser$(date +%s)"
    
    echo "Creating user: $TEST_EMAIL"
    
    # Register new user
    response=$(curl -s -X POST "$BASE_URL/register" \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -d "username=$TEST_USERNAME&email=$TEST_EMAIL&password=$TEST_PASSWORD" \
        -w '\n%{redirect_url}')
    
    # Extract API key from redirect URL
    redirect_url=$(echo "$response" | tail -n1)
    
    if echo "$redirect_url" | grep -q "apiKey="; then
        API_KEY=$(echo "$redirect_url" | grep -o 'apiKey=[^&]*' | cut -d'=' -f2 | python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null || echo "$redirect_url" | grep -o 'apiKey=[^&]*' | cut -d'=' -f2)
        
        if [ -n "$API_KEY" ]; then
            echo "Got API key: ${API_KEY:0:20}..."
            echo ""
            echo "IMPORTANT: Save this API key for future use:"
            echo "$API_KEY"
            echo ""
            return 0
        fi
    fi
    
    echo "Failed to create user or extract API key"
    echo "Response: $response"
    exit 1
}

check_server

# If --create-user flag is set, create a new user
if [ "$CREATE_USER" = "true" ]; then
    create_test_user
fi

# If no API key is set, show error
if [ -z "$API_KEY" ]; then
    echo "ERROR: No API key provided"
    echo ""
    echo "You can provide an API key in several ways:"
    echo "1. Set API_KEY environment variable: API_KEY=strtchy_xxx... $0"
    echo "2. Use --api-key flag: $0 --api-key strtchy_xxx..."
    echo "3. Create a new test user: $0 --create-user"
    echo ""
    echo "Run '$0 --help' for more information"
    exit 1
fi

echo ""
echo "=== Testing Public Endpoints ==="

test_endpoint "GET all movements" "GET" "/api/movements" "200"
test_endpoint "GET all routines" "GET" "/api/routines" "200"

# Get an existing movement ID early to use in tests
response=$(make_request "GET" "/api/movements" "" "")
movements_json=$(echo "$response" | sed '$d')
EXISTING_MOVEMENT_ID=$(echo "$movements_json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "=== Testing Authenticated Endpoints (Movements) ==="

# Create movement with unique name using timestamp
TEST_MOVEMENT_NAME="Test Movement $(date +%s)"
test_endpoint "POST create movement" "POST" "/api/movements" "201" "{\"name\":\"$TEST_MOVEMENT_NAME\",\"description\":\"Test description\",\"type\":\"timed\",\"defaultValue\":30,\"defaultUnit\":null,\"isBilateral\":false}" "$API_KEY"

# Get the newly created movement ID (should be first in the list since sorted by createdAt desc)
response=$(make_request "GET" "/api/movements" "" "")
movements_json=$(echo "$response" | sed '$d')
# Get the first ID from the response (newest movement first)
MOVEMENT_ID=$(echo "$movements_json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Test getting and updating the specific movement
if [ -n "$MOVEMENT_ID" ]; then
    test_endpoint "GET single movement" "GET" "/api/movements/$MOVEMENT_ID" "200" "" "$API_KEY"
    test_endpoint "PATCH update movement" "PATCH" "/api/movements/$MOVEMENT_ID" "200" "{\"name\":\"Updated $TEST_MOVEMENT_NAME\",\"description\":\"Updated description\"}" "$API_KEY"
fi

echo ""
echo "=== Testing Authenticated Endpoints (Routines) ==="

# Use existing movement ID for routine tests
if [ -n "$EXISTING_MOVEMENT_ID" ]; then
    # Create routine with actual movement data (movementsData must be a JSON string with escaped quotes)
    # Build the routine data as proper JSON
    ROUTINE_NAME="Test Routine $(date +%s)"
    ROUTINE_DATA=$(cat <<EOF
{"name":"$ROUTINE_NAME","description":"Test routine","restBetweenMovements":10,"restBetweenSets":30,"autoAdvance":true,"audioEnabled":true,"keepAwake":true,"movementsData":"[{\\"movementId\\":\\"$EXISTING_MOVEMENT_ID\\",\\"order\\":0,\\"target\\":{\\"type\\":\\"time\\",\\"value\\":30,\\"unit\\":\\"seconds\\"},\\"sets\\":1,\\"isBilateral\\":false,\\"switchSidesDuration\\":5}]"}
EOF
)
    test_endpoint "POST create routine" "POST" "/api/routines" "201" "$ROUTINE_DATA" "$API_KEY"
    
    # Get routines and test other endpoints
    response=$(make_request "GET" "/api/routines" "" "")
    routines_json=$(echo "$response" | sed '$d')
    ROUTINE_ID=$(echo "$routines_json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$ROUTINE_ID" ]; then
        test_endpoint "GET single routine" "GET" "/api/routines/$ROUTINE_ID" "200" "" ""
        test_endpoint "PATCH update routine" "PATCH" "/api/routines/$ROUTINE_ID" "200" "{\"name\":\"Updated Routine $(date +%s)\"}" "$API_KEY"
        test_endpoint "DELETE routine" "DELETE" "/api/routines/$ROUTINE_ID" "200" "" "$API_KEY"
    fi
    
    # Delete test movement last (after routine is deleted to avoid FK constraint)
    if [ -n "$MOVEMENT_ID" ]; then
        test_endpoint "DELETE movement" "DELETE" "/api/movements/$MOVEMENT_ID" "200" "" "$API_KEY"
    fi
else
    echo "Skipping routine tests - no movements available"
fi

echo ""
echo "========================================"
echo "Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
echo "========================================"

if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi

exit 0
