# Strtchy REST API

A comprehensive REST API for managing movements and routines in the Strtchy stretching app.

## Base URL

```
http://localhost:5173  # Development
https://your-domain.com  # Production
```

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <session_token>
```

To get a session token, users must authenticate through the web interface. The session token is stored in the `session.token` field in the database.

| Endpoint Type | Auth Required |
|---------------|---------------|
| `GET /api/movements` | No (public) |
| `GET /api/movements/[id]` | No (public) |
| `POST /api/movements` | Yes |
| `PATCH /api/movements/[id]` | Yes |
| `DELETE /api/movements/[id]` | Yes |
| `GET /api/routines` | No (public) |
| `GET /api/routines/[id]` | No (public) |
| `POST /api/routines` | Yes |
| `PATCH /api/routines/[id]` | Yes |
| `DELETE /api/routines/[id]` | Yes |
| `PATCH /api/routines/[id]/movements/[routineMovementId]` | Yes |
| `DELETE /api/routines/[id]/movements/[routineMovementId]` | Yes |

## Response Format

All responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "fieldName", "message": "Error description" }
  ]
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (duplicate name) |
| 500 | Internal Server Error |

---

## Movements API

### List All Movements

```http
GET /api/movements
```

Returns all movements ordered by creation date (newest first).

**Response (200):**
```json
{
  "success": true,
  "movements": [
    {
      "id": "mv_hamstring-stretch",
      "name": "Hamstring Stretch",
      "description": "Stretch the back of your thigh",
      "type": "timed",
      "illustrationPath": "/uploads/movements/hamstring-stretch.jpg",
      "isCustom": true,
      "userId": "user_abc123",
      "weightUnit": null,
      "isBilateral": true,
      "switchSidesDuration": 5,
      "timePerRep": null,
      "equipment": ["yoga mat"],
      "metadata": {
        "defaultTarget": { "type": "time", "value": 30, "unit": null }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Single Movement

```http
GET /api/movements/{id}
```

**Path Parameters:**
- `id` - Movement ID (e.g., `mv_hamstring-stretch`)

**Response (200):**
```json
{
  "success": true,
  "movement": { ... }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Movement not found"
}
```

### Create Movement

```http
POST /api/movements
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Hamstring Stretch",
  "description": "Stretch the back of your thigh",
  "type": "timed",
  "defaultValue": 30,
  "defaultUnit": null,
  "timePerRep": null,
  "isBilateral": true,
  "switchSidesDuration": 5,
  "equipment": ["yoga mat"],
  "illustration": null
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Movement name (1-100 chars) |
| `description` | string | No | Description (max 500 chars) |
| `type` | enum | Yes | `timed`, `reps`, `weighted`, `resistance_band` |
| `defaultValue` | number | Yes | Default target value (positive integer) |
| `defaultUnit` | enum | No | `lbs`, `kg`, `bodyweight` (for weighted types) |
| `timePerRep` | number | No | Seconds per rep (for rep types, min 1) |
| `isBilateral` | boolean | No | Whether exercise requires both sides (default: false) |
| `switchSidesDuration` | number | No | Seconds to switch sides (min 0, default: 5) |
| `equipment` | string[] | No | List of equipment names |
| `illustration` | File | No | Image file (JPEG/PNG/WebP, max 5MB) |

**Response (201):**
```json
{
  "success": true,
  "movement": { ... }
}
```

**Response (400):** Validation error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name is required" }
  ]
}
```

**Response (409):** Duplicate name
```json
{
  "success": false,
  "error": "Movement \"Hamstring Stretch\" already exists"
}
```

### Update Movement

```http
PATCH /api/movements/{id}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** All fields are optional (partial update):
```json
{
  "name": "New Name",
  "description": "New description",
  "defaultValue": 60
}
```

**Response (200):**
```json
{
  "success": true,
  "movement": { ... }
}
```

**Response (404):** Movement not found

**Response (409):** Duplicate name

### Delete Movement

```http
DELETE /api/movements/{id}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Movement deleted"
}
```

**Response (404):** Movement not found

---

## Routines API

### List All Routines

```http
GET /api/routines
```

Returns all routines with movement counts, ordered by creation date (newest first).

**Response (200):**
```json
{
  "success": true,
  "routines": [
    {
      "id": "rt_morning-flow",
      "name": "Morning Flow",
      "description": "Wake up your body",
      "restBetweenMovements": 10,
      "restBetweenSets": 30,
      "autoAdvance": true,
      "audioEnabled": true,
      "keepAwake": true,
      "userId": "user_abc123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "movementsCount": 5
    }
  ]
}
```

### Get Single Routine

```http
GET /api/routines/{id}
```

**Path Parameters:**
- `id` - Routine ID (e.g., `rt_morning-flow`)

**Response (200):**
```json
{
  "success": true,
  "routine": {
    "id": "rt_morning-flow",
    "name": "Morning Flow",
    "description": "Wake up your body",
    "restBetweenMovements": 10,
    "restBetweenSets": 30,
    "autoAdvance": true,
    "audioEnabled": true,
    "keepAwake": true,
    "userId": "user_abc123",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "movements": [
      {
        "id": "rm_morning-flow-hamstring-stretch-0",
        "routineId": "rt_morning-flow",
        "movementId": "mv_hamstring-stretch",
        "order": 0,
        "target": { "type": "time", "value": 30, "unit": null },
        "sets": 3,
        "isBilateral": true,
        "switchSidesDuration": 5,
        "weight": null,
        "weightUnit": null,
        "notes": null,
        "movement": { ... }
      }
    ]
  }
}
```

### Create Routine

```http
POST /api/routines
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Morning Flow",
  "description": "Wake up your body",
  "restBetweenMovements": 10,
  "restBetweenSets": 30,
  "autoAdvance": true,
  "audioEnabled": true,
  "keepAwake": true,
  "movementsData": [
    {
      "movementId": "mv_hamstring-stretch",
      "order": 0,
      "target": { "type": "time", "value": 30 },
      "sets": 3,
      "isBilateral": true,
      "switchSidesDuration": 5
    },
    {
      "movementId": "mv_quad-stretch",
      "order": 1,
      "target": { "type": "time", "value": 30 },
      "sets": 3,
      "isBilateral": true,
      "switchSidesDuration": 5
    }
  ]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Routine name (1-100 chars) |
| `description` | string | No | Description (max 500 chars) |
| `restBetweenMovements` | number | Yes | Seconds between movements (min 0) |
| `restBetweenSets` | number | Yes | Seconds between sets (min 0) |
| `autoAdvance` | boolean | No | Auto-advance to next exercise (default: true) |
| `audioEnabled` | boolean | No | Enable audio cues (default: true) |
| `keepAwake` | boolean | No | Keep screen awake (default: true) |
| `movementsData` | array | Yes | Array of movement configurations |

**movementsData Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `movementId` | string | Yes | ID of the movement to add |
| `order` | number | Yes | Order index (0, 1, 2, ...) |
| `target.type` | enum | Yes | `time` or `reps` |
| `target.value` | number | Yes | Target value (positive) |
| `target.unit` | string | No | Custom unit tag |
| `target.customTag` | string | No | Custom tag |
| `sets` | number | No | Number of sets (default: 1) |
| `isBilateral` | boolean | No | Exercise is bilateral (default: false) |
| `switchSidesDuration` | number | No | Seconds to switch sides (default: 5) |
| `weight` | number | No | Weight value |
| `weightUnit` | enum | No | `lbs`, `kg`, `bodyweight` |
| `notes` | string | No | Notes for this movement (max 500) |

**Response (201):**
```json
{
  "success": true,
  "routine": { ... }
}
```

### Update Routine

```http
PATCH /api/routines/{id}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** All fields are optional:

```json
{
  "name": "New Routine Name",
  "restBetweenMovements": 15
}
```

To update movements within a routine, include `movementsData`:

```json
{
  "movementsData": [
    {
      "movementId": "mv_hamstring-stretch",
      "order": 0,
      "target": { "type": "time", "value": 60 },
      "sets": 2,
      "isBilateral": true,
      "switchSidesDuration": 5
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "routine": { ... }
}
```

### Delete Routine

```http
DELETE /api/routines/{id}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Routine deleted"
}
```

---

## Routine Movements API

### Update Movement Configuration

```http
PATCH /api/routines/{routineId}/movements/{routineMovementId}
```

**Path Parameters:**
- `routineId` - Routine ID (e.g., `rt_morning-flow`)
- `routineMovementId` - Routine movement ID (e.g., `rm_morning-flow-hamstring-stretch-0`)

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** All fields are optional (partial update):
```json
{
  "target": { "value": 45 },
  "sets": 4,
  "notes": "Hold deeper"
}
```

**Response (200):**
```json
{
  "success": true,
  "routineMovement": { ... }
}
```

### Remove Movement from Routine

```http
DELETE /api/routines/{routineId}/movements/{routineMovementId}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Movement removed from routine"
}
```

---

## Error Handling

### Validation Errors

When validation fails, the response includes details about each error:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name is required" },
    { "field": "type", "message": "Invalid enum value" }
  ]
}
```

### Authentication Errors

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Not Found Errors

```json
{
  "success": false,
  "error": "Movement not found"
}
```

### Conflict Errors

```json
{
  "success": false,
  "error": "Movement \"Hamstring Stretch\" already exists"
}
```

---

## Example: cURL Commands

### List Movements
```bash
curl -X GET http://localhost:5173/api/movements
```

### Get Movement
```bash
curl -X GET http://localhost:5173/api/movements/mv_hamstring-stretch
```

### Create Movement (authenticated)
```bash
curl -X POST http://localhost:5173/api/movements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Calf Stretch",
    "type": "timed",
    "defaultValue": 30,
    "isBilateral": true
  }'
```

### Update Movement (authenticated)
```bash
curl -X PATCH http://localhost:5173/api/movements/mv_calf-stretch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"defaultValue": 45}'
```

### Delete Movement (authenticated)
```bash
curl -X DELETE http://localhost:5173/api/movements/mv_calf-stretch \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Create Routine (authenticated)
```bash
curl -X POST http://localhost:5173/api/routines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Evening Stretch",
    "restBetweenMovements": 10,
    "restBetweenSets": 30,
    "movementsData": [
      {
        "movementId": "mv_hamstring-stretch",
        "order": 0,
        "target": { "type": "time", "value": 30 },
        "sets": 2,
        "isBilateral": true
      }
    ]
  }'
```

---

## TypeScript Types

```typescript
// Movement Types
type MovementType = 'timed' | 'reps' | 'weighted' | 'resistance_band';
type WeightUnit = 'lbs' | 'kg' | 'bodyweight';

interface Movement {
  id: string;
  name: string;
  description: string | null;
  type: MovementType;
  illustrationPath: string | null;
  isCustom: boolean;
  userId: string;
  weightUnit: WeightUnit | null;
  isBilateral: boolean;
  switchSidesDuration: number;
  timePerRep: number | null;
  equipment: string[];
  metadata: {
    defaultTarget: {
      type: 'time' | 'reps';
      value: number;
      unit: string | null;
    };
  };
  createdAt: Date;
}

// Routine Types
interface Routine {
  id: string;
  name: string;
  description: string | null;
  restBetweenMovements: number;
  restBetweenSets: number;
  autoAdvance: boolean;
  audioEnabled: boolean;
  keepAwake: boolean;
  userId: string;
  createdAt: Date;
  movements: RoutineMovement[];
}

interface RoutineMovement {
  id: string;
  routineId: string;
  movementId: string;
  order: number;
  target: {
    type: 'time' | 'reps';
    value: number;
    unit?: string;
    customTag?: string;
  };
  sets: number;
  isBilateral: boolean;
  switchSidesDuration: number;
  weight: number | null;
  weightUnit: WeightUnit | null;
  notes: string | null;
  movement: Movement;
}
```
