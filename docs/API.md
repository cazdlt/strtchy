# Strtchy REST API

A comprehensive REST API for managing movements, routines, and practice sessions in the Strtchy stretching app.

## Base URL

```
http://localhost:5173  # Development
https://your-domain.com  # Production
```

## Authentication

All write operations (POST, PATCH, DELETE) require an API key in the `Authorization` header:

```http
Authorization: Bearer <api_key>
```

### Getting an API Key

API keys are managed through the web interface at `/settings/api`. Each user can have one API key at a time.

**Key Format:**

- Prefix: `strtchy_`
- Length: 32 characters after prefix
- Example: `strtchy_a1b2c3d4e5f6...`

**Important:** The API key is only shown once when generated. Store it securely.

### Authentication Endpoints

| Endpoint                                                  | Auth Required | Description                    |
| --------------------------------------------------------- | ------------- | ------------------------------ |
| `GET /api/movements`                                      | No            | List all movements (public)    |
| `GET /api/movements/[id]`                                 | No            | Get single movement (public)   |
| `POST /api/movements`                                     | Yes           | Create movement                |
| `PATCH /api/movements/[id]`                               | Yes           | Update movement                |
| `DELETE /api/movements/[id]`                              | Yes           | Delete movement                |
| `GET /api/routines`                                       | No            | List all routines (public)     |
| `GET /api/routines/[id]`                                  | No            | Get single routine (public)    |
| `POST /api/routines`                                      | Yes           | Create routine                 |
| `PATCH /api/routines/[id]`                                | Yes           | Update routine                 |
| `DELETE /api/routines/[id]`                               | Yes           | Delete routine                 |
| `PATCH /api/routines/[id]/movements/[routineMovementId]`  | Yes           | Update routine movement config |
| `DELETE /api/routines/[id]/movements/[routineMovementId]` | Yes           | Remove movement from routine   |

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
  "details": [{ "field": "fieldName", "message": "Error description" }]
}
```

## Status Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | Success                                   |
| 201  | Created                                   |
| 400  | Bad Request / Validation Error            |
| 401  | Unauthorized (invalid or missing API key) |
| 404  | Not Found                                 |
| 409  | Conflict (duplicate name)                 |
| 500  | Internal Server Error                     |

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
        "defaultTarget": { "type": "time", "value": 30, "unit": null },
        "suggestedTags": ["lower body", "flexibility"]
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
Authorization: Bearer <api_key>
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

| Field                 | Type     | Required | Description                                               |
| --------------------- | -------- | -------- | --------------------------------------------------------- |
| `name`                | string   | Yes      | Movement name (1-100 chars)                               |
| `description`         | string   | No       | Description (max 500 chars)                               |
| `type`                | enum     | Yes      | `timed`, `reps`, `weighted`, `resistance_band`            |
| `defaultValue`        | number   | Yes      | Default target value (positive integer)                   |
| `defaultUnit`         | enum     | No       | `lbs`, `kg`, `bodyweight` (for weighted/resistance types) |
| `timePerRep`          | number   | No       | Seconds per rep (for rep types, min 1)                    |
| `isBilateral`         | boolean  | No       | Whether exercise requires both sides (default: false)     |
| `switchSidesDuration` | number   | No       | Seconds to switch sides (min 0, default: 5)               |
| `equipment`           | string[] | No       | List of equipment names (comma-separated string or array) |
| `illustration`        | File     | No       | Image file (JPEG/PNG/WebP, max 5MB)                       |

**Movement Types:**

- `timed` - Time-based exercise (hold for X seconds)
- `reps` - Repetition-based exercise (do X reps)
- `weighted` - Weighted exercise with weight value
- `resistance_band` - Resistance band exercise

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
  "details": [{ "field": "name", "message": "Name is required" }]
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
Authorization: Bearer <api_key>
```

**Request Body:** All fields are optional (partial update):

```json
{
  "name": "New Name",
  "description": "New description",
  "defaultValue": 60,
  "isBilateral": false
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
Authorization: Bearer <api_key>
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
      "isCustom": true,
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
    "isCustom": true,
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
Authorization: Bearer <api_key>
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

| Field                  | Type    | Required | Description                                       |
| ---------------------- | ------- | -------- | ------------------------------------------------- |
| `name`                 | string  | Yes      | Routine name (1-100 chars)                        |
| `description`          | string  | No       | Description (max 500 chars)                       |
| `restBetweenMovements` | number  | Yes      | Seconds between movements (min 0)                 |
| `restBetweenSets`      | number  | Yes      | Seconds between sets (min 0)                      |
| `autoAdvance`          | boolean | No       | Auto-advance to next exercise (default: true)     |
| `audioEnabled`         | boolean | No       | Enable audio cues (default: true)                 |
| `keepAwake`            | boolean | No       | Keep screen awake during practice (default: true) |
| `movementsData`        | array   | Yes      | Array of movement configurations                  |

**movementsData Fields:**

| Field                 | Type    | Required | Description                            |
| --------------------- | ------- | -------- | -------------------------------------- |
| `movementId`          | string  | Yes      | ID of the movement to add              |
| `order`               | number  | Yes      | Order index (0, 1, 2, ...)             |
| `target.type`         | enum    | Yes      | `time` or `reps`                       |
| `target.value`        | number  | Yes      | Target value (positive)                |
| `target.unit`         | string  | No       | Custom unit tag                        |
| `target.customTag`    | string  | No       | Custom tag for the target              |
| `sets`                | number  | No       | Number of sets (default: 1)            |
| `isBilateral`         | boolean | No       | Exercise is bilateral (default: false) |
| `switchSidesDuration` | number  | No       | Seconds to switch sides (default: 5)   |
| `weight`              | number  | No       | Weight value for weighted exercises    |
| `weightUnit`          | enum    | No       | `lbs`, `kg`, `bodyweight`              |
| `notes`               | string  | No       | Notes for this movement (max 500)      |

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
Authorization: Bearer <api_key>
```

**Request Body:** All fields are optional:

```json
{
  "name": "New Routine Name",
  "restBetweenMovements": 15,
  "autoAdvance": false
}
```

Note: The `movementsData` field cannot be updated via this endpoint. Use the individual routine movement endpoints instead.

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
Authorization: Bearer <api_key>
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
Authorization: Bearer <api_key>
```

**Request Body:** All fields are optional (partial update):

```json
{
  "target": { "value": 45 },
  "sets": 4,
  "notes": "Hold deeper",
  "isBilateral": true,
  "switchSidesDuration": 10
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
  -H "Authorization: Bearer strtchy_YOUR_API_KEY" \
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
  -H "Authorization: Bearer strtchy_YOUR_API_KEY" \
  -d '{"defaultValue": 45}'
```

### Delete Movement (authenticated)

```bash
curl -X DELETE http://localhost:5173/api/movements/mv_calf-stretch \
  -H "Authorization: Bearer strtchy_YOUR_API_KEY"
```

### Create Routine (authenticated)

```bash
curl -X POST http://localhost:5173/api/routines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer strtchy_YOUR_API_KEY" \
  -d '{
    "name": "Evening Stretch",
    "restBetweenMovements": 10,
    "restBetweenSets": 30,
    "movementsData": [
      {
        "movementId": "mv_hamstring-stretch",
        "order": 0,
        "target": {"type": "time", "value": 30},
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
type MovementType = "timed" | "reps" | "weighted" | "resistance_band";
type WeightUnit = "lbs" | "kg" | "bodyweight";
type TargetType = "time" | "reps";

interface Movement {
  id: string;
  name: string;
  description: string | null;
  type: MovementType;
  illustrationPath: string | null;
  isCustom: boolean;
  userId: string | null;
  weightUnit: WeightUnit | null;
  isBilateral: boolean;
  switchSidesDuration: number;
  timePerRep: number | null;
  equipment: string[] | null;
  metadata: {
    defaultTarget?: {
      type: TargetType;
      value: number;
      unit?: string;
    };
    suggestedTags?: string[];
  } | null;
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
  isCustom: boolean;
  userId: string | null;
  createdAt: Date;
  movements?: RoutineMovement[];
  movementsCount?: number;
}

interface RoutineMovement {
  id: string;
  routineId: string;
  movementId: string;
  order: number;
  target: {
    type: TargetType;
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
  movement?: Movement;
}
```

---

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
│       ├── auth.ts         # API key authentication
│       ├── apiKey.ts       # API key generation/validation
│       └── errors.ts       # Error formatting
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

---

## API Key Management

API keys are managed through the web interface at `/settings/api`.

### Features:

- **Generate**: Create a new API key (replaces any existing key)
- **View Prefix**: See the first 16 characters of your key for identification
- **Revoke**: Delete your API key to prevent further access

### Security:

- API keys are hashed using SHA-256 before storage
- Only the prefix is stored in plain text for identification
- Keys are only shown once upon generation
- Last used timestamp is tracked for each key

---

## Shared Logic

All API endpoints reuse the same validation and database logic as the web forms:

- **Validation**: Zod schemas ensure data integrity
- **Duplicate Checking**: Prevents duplicate names
- **ID Generation**: Uses existing slug-based ID generation
- **Database Operations**: Shared helpers for CRUD operations

This ensures **100% consistency** between API and web interface.
