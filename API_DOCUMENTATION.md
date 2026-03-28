# Strtchy API Documentation

## Overview
Full CRUD API for managing movements and routines with Bearer token authentication.

## Authentication
All write operations (POST, PATCH, DELETE) require a Bearer token in the Authorization header:
```
Authorization: Bearer <session-token>
```

**Get your session token:** Log in via the web app and extract the `session.token` from the session cookie or database.

## Endpoints

### Movements

#### List all movements (Public)
```http
GET /api/movements
```

#### Get single movement (Public)
```http
GET /api/movements/[id]
```

#### Create movement (Authenticated)
```http
POST /api/movements
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Hamstring Stretch",
  "type": "timed",
  "defaultValue": 60,
  "isBilateral": true,
  "switchSidesDuration": 5,
  "metadata": {
    "defaultTarget": {
      "type": "time",
      "value": 60
    }
  }
}
```

#### Update movement (Authenticated)
```http
PATCH /api/movements/[id]
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "isBilateral": false
}
```

#### Delete movement (Authenticated)
```http
DELETE /api/movements/[id]
Authorization: Bearer <token>
```

### Routines

#### List all routines (Public)
```http
GET /api/routines
```

#### Get single routine with movements (Public)
```http
GET /api/routines/[id]
```

#### Create routine (Authenticated)
```http
POST /api/routines
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Morning Routine",
  "description": "Start your day right",
  "restBetweenMovements": 30,
  "restBetweenSets": 15,
  "autoAdvance": true,
  "audioEnabled": true,
  "keepAwake": true,
  "movementsData": [
    {
      "movementId": "mv_hamstring-stretch",
      "order": 0,
      "target": {
        "type": "time",
        "value": 60,
        "unit": "seconds"
      },
      "sets": 1,
      "isBilateral": true,
      "switchSidesDuration": 5,
      "notes": "Hold for 60 seconds each side"
    }
  ]
}
```

#### Update routine (Authenticated)
```http
PATCH /api/routines/[id]
Content-Type: application/json
Authorization: Bearer <token>

{
  "restBetweenMovements": 45,
  "restBetweenSets": 30,
  "movementsData": [
    // Full movements array to replace existing
  ]
}
```

#### Delete routine (Authenticated)
```http
DELETE /api/routines/[id]
Authorization: Bearer <token>
```

### Routine Movement Config

#### Update routine movement config (Authenticated)
```http
PATCH /api/routines/[id]/movements/[routineMovementId]
Content-Type: application/json
Authorization: Bearer <token>

{
  "sets": 3,
  "isBilateral": true,
  "target": {
    "type": "time",
    "value": 90,
    "unit": "seconds"
  }
}
```

#### Remove movement from routine (Authenticated)
```http
DELETE /api/routines/[id]/movements/[routineMovementId]
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "movement": { ... },
  "routine": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "fieldErrors": {
    "name": "Name is required",
    "type": "Invalid type"
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate name)
- `500` - Server Error

## Data Types

### Movement Types
- `timed` - Time-based exercise
- `reps` - Repetition-based exercise  
- `weighted` - Weighted exercise
- `resistance_band` - Resistance band exercise

### Target Types
- `time` - Duration in seconds
- `reps` - Number of repetitions

### Weight Units
- `lbs` - Pounds
- `kg` - Kilograms
- `bodyweight` - Bodyweight

## Example: Complete Workflow

```bash
# 1. Create a movement
curl -X POST https://strtchy.example.com/api/movements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quad Stretch",
    "type": "timed",
    "defaultValue": 45,
    "isBilateral": true
  }'

# 2. Create a routine with that movement
curl -X POST https://strtchy.example.com/api/routines \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Post-Run Stretch",
    "restBetweenMovements": 30,
    "restBetweenSets": 15,
    "movementsData": [
      {
        "movementId": "mv_quad-stretch",
        "order": 0,
        "target": {"type": "time", "value": 45},
        "sets": 2,
        "isBilateral": true
      }
    ]
  }'

# 3. Update routine settings
curl -X PATCH https://strtchy.example.com/api/routines/rt-post-run-stretch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"restBetweenMovements": 45}'

# 4. Update movement bilaterality
curl -X PATCH https://strtchy.example.com/api/movements/mv_quad-stretch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isBilateral": false}'
```

## File Structure

```
src/
├── lib/
│   ├── validation/
│   │   ├── schemas/
│   │   │   ├── movement.ts
│   │   │   └── routine.ts
│   │   └── helpers/
│   │       ├── parsers.ts
│   │       ├── duplicates.ts
│   │       └── errors.ts
│   ├── db/helpers/
│   │   ├── movements.ts
│   │   ├── routines.ts
│   │   └── files.ts
│   └── api/
│       ├── auth.ts
│       └── errors.ts
└── routes/api/
    ├── movements/
    │   ├── +server.ts
    │   └── [id]/
    │       └── +server.ts
    └── routines/
        ├── +server.ts
        └── [id]/
            ├── +server.ts
            └── movements/[routineMovementId]/
                └── +server.ts
```

## Shared Logic

All API endpoints reuse the same validation and database logic as the web forms:

- **Validation**: Zod schemas ensure data integrity
- **Duplicate Checking**: Prevents duplicate names
- **ID Generation**: Uses existing slug-based ID generation
- **Database Operations**: Shared helpers for CRUD operations

This ensures **100% consistency** between API and web interface.
