# ResumeCraft Backend

This is a minimal Node/Express backend for the ResumeCraft frontend. It provides simple user signup/login and CRUD for user resumes using MongoDB.

Quick start:
1. Install dependencies

```powershell
cd "d:\college\Front_End\Online Resume Builder\front end codes\server"
npm install
```

3. Start the server:

```powershell
npm run dev
# or
npm start
```

The server runs on port `3000` by default. Frontend scripts expect the API at `http://localhost:3000/api`.

API Endpoints:
- `POST /api/auth/signup` { name, email, password }
- `POST /api/auth/login` { email, password }
- `GET /api/resumes` (auth)
- `POST /api/resumes` (auth)
- `GET /api/resumes/:id` (auth)
- `PUT /api/resumes/:id` (auth)
- `DELETE /api/resumes/:id` (auth)

Security note: This backend is intentionally simple for demo purposes. Do not use in production without improving validation, rate-limiting, stronger secrets and HTTPS.
