# Student ID Card Validation System — Server

Backend API for the Web-Based Student ID Card Validation System. Provides cryptographically signed QR token issuance, scan validation, student management, and audit logging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | MongoDB via Mongoose |
| Auth | JWT (access + refresh tokens) |
| QR signing | HMAC-SHA256 (Node `crypto`) |
| QR image | `qrcode` npm package |
| Password hashing | bcryptjs |

---

## Installation

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in **all** values — especially:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Long random string (≥32 chars) |
| `JWT_REFRESH_SECRET` | Long random string, different from above |
| `QR_TOKEN_SECRET` | Long random string for HMAC-SHA256 signing |
| `CLIENT_ORIGINS` | Comma-separated allowed origins, e.g. `http://localhost:5173,http://localhost:5174` |

> **⚠️ Never commit `.env` to version control.**

Generate strong secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Seed the database

Creates the initial `registrar_admin` account (credentials from `.env`):

```bash
npm run seed
```

You should see:
```
[seed] Connected to MongoDB
[seed] ✅ Admin account created successfully!
       Name:  Super Admin
       Email: admin@university.edu
       Role:  registrar_admin
```

> The seed script is **idempotent** — running it again will not create a duplicate.

---

## Running the server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Default port: **3000** (configurable via `PORT` env var).

---

## API Overview

### Health Check (public)
```
GET /api/health
```

### Authentication (public)

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@university.edu", "password": "Admin@1234"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": "15m",
    "staff": { "id": "...", "name": "Super Admin", "email": "admin@university.edu", "role": "registrar_admin" }
  }
}
```

**Refresh access token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your_refresh_token>"}'
```

### Protected Endpoints

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/students` | registrar_admin | Create student + issue QR token |
| GET | `/api/students` | registrar_admin | List/search students |
| PATCH | `/api/students/:id` | registrar_admin | Update student fields |
| POST | `/api/students/:id/reissue-token` | registrar_admin | Revoke + reissue QR token |
| POST | `/api/scan/validate` | all roles | Validate a scanned QR token |
| GET | `/api/logs` | registrar_admin | View audit scan logs |

### Create a student (example)
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "matricNumber": "CSC/2022/001",
    "fullName": "Jane Doe",
    "department": "Computer Science",
    "programLevel": "undergraduate",
    "validUntil": "2025-12-31"
  }'
```

Returns: `student`, `tokenStr` (the QR payload string), `qrImage` (base64 PNG data URL), `tokenExpiresAt`.

### Validate a scan
```bash
curl -X POST http://localhost:3000/api/scan/validate \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"token": "<base64url_token_from_qr_code>", "locationTag": "Library Gate 1"}'
```

---

## Architecture

```
Routes → Controllers → Services → Mongoose Models
```

- **Routes**: Wire HTTP verbs to controller functions only.
- **Controllers**: Validate HTTP inputs, call services, shape HTTP responses.
- **Services**: Own all business logic. Only layer that touches models directly.
- **Models**: Mongoose schemas — data shape, validation, indexes.

The QR token's HMAC-SHA256 signature is verified **server-side on every scan** using `crypto.timingSafeEqual`. The student document stores only a SHA-256 hash of the active token — the plaintext token is never persisted.

---

## RBAC Roles

| Role | Permissions |
|---|---|
| `security` | `/api/scan/validate` only |
| `library` | `/api/scan/validate` only |
| `exam_invigilator` | `/api/scan/validate` only |
| `registrar_admin` | Full access: students, scan, logs |

---

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes by default
- QR tokens are HMAC-SHA256 signed; only a matching hash is stored in the DB
- All scan attempts (valid and invalid) are logged for audit
- CORS restricted to `CLIENT_ORIGINS` list
- Generic auth error messages prevent user enumeration
- `crypto.timingSafeEqual` used for signature comparison (prevents timing attacks)

> **TODO (production hardening):**
> - Add `express-rate-limit` to `/api/auth/login` (≤5 req/min per IP) and `/api/scan/validate`
> - Use HTTPS at the reverse proxy layer (nginx/caddy)
> - Rotate secrets regularly; consider a secrets manager (Vault, AWS Secrets Manager)
