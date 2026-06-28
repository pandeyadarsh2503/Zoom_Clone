# Deployment Guide

Deploy the **Zoom Clone** to production:

| Layer | Stack | Host |
|---|---|---|
| Frontend | Next.js 16 (App Router) | **Vercel** |
| Backend | FastAPI + SQLAlchemy + WebSockets | **Railway** or **Render** |
| Database | PostgreSQL (managed) | Railway / Render |

The two halves are wired by **two URLs**:
- the frontend needs `NEXT_PUBLIC_API_URL` → the backend's public URL
- the backend needs `ALLOWED_ORIGINS` / `FRONTEND_URL` → the frontend's Vercel URL

Deploy the backend first (so you have its URL), then the frontend, then come back and fill in the frontend URL on the backend.

---

## 0. Prepare the repository

A `.gitignore` is included and `.venv/`, `__pycache__/`, `*.db`, and `.env` have been untracked. Commit and push to GitHub:

```bash
git add -A
git commit -m "Prepare production deployment"
git push origin main
```

> Both `.env` files stay on your machine but are no longer committed. **Never commit real secrets** — set them in the host dashboards instead.

---

## 1. Backend — Railway (Option A)

1. Go to **railway.app** → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. In the service **Settings**, set **Root Directory** to `backend`.
   - Railway auto-detects Python and installs `requirements.txt`. The included **`Procfile`** provides the start command (`uvicorn … --port $PORT`).
3. Add a database: **New** → **Database** → **PostgreSQL**. Railway exposes a `DATABASE_URL` reference variable.
4. In the API service → **Variables**, set:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
   | `SECRET_KEY` | a long random string — `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
   | `ENVIRONMENT` | `production` |
   | `ALLOWED_ORIGINS` | `["https://<your-app>.vercel.app"]` *(fill after step 3)* |
   | `FRONTEND_URL` | `https://<your-app>.vercel.app` *(fill after step 3)* |

5. Generate a public domain: service → **Settings** → **Networking** → **Generate Domain**.
6. Verify: open `https://<your-api>.up.railway.app/health` → `{"status":"healthy",...}`.

## 1. Backend — Render (Option B)

**Blueprint (one click):** the repo ships a **`backend/render.yaml`** that provisions the web service **and** a free Postgres database.
- Render dashboard → **New** → **Blueprint** → select this repo → Apply.
- After it builds, open the service → **Environment** and set `FRONTEND_URL` and `ALLOWED_ORIGINS` to your Vercel URL (step 3). `SECRET_KEY` and `DATABASE_URL` are wired automatically.

**Manual:** New → **Web Service** → root directory `backend`, Build `pip install -r requirements.txt`, Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, health check `/health`, then add the env vars above. Create a separate **PostgreSQL** instance and copy its Internal Connection String into `DATABASE_URL`.

> A **Dockerfile** is also included if you prefer container deploys (Railway/Render/Fly).

---

## 2. Frontend — Vercel

1. **vercel.com** → **Add New** → **Project** → import this repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects Next.js).
3. **Environment Variables** → add:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your backend URL, e.g. `https://zoom-clone-api.onrender.com` (no trailing slash) |

4. **Deploy.** Vercel runs `next build` and gives you `https://<your-app>.vercel.app`.

---

## 3. Wire the two together

Now that you know the Vercel URL, go back to the **backend** host and set (then redeploy):

```
ALLOWED_ORIGINS=["https://<your-app>.vercel.app"]
FRONTEND_URL=https://<your-app>.vercel.app
```

This is required for CORS (API calls) and for the WebSocket to be reachable. The frontend derives the WebSocket URL from `NEXT_PUBLIC_API_URL` automatically (`https` → `wss`), so no separate WS variable is needed.

---

## Environment variables — reference

**Backend** (see `backend/.env.example`)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ prod | `postgresql://…` (a `postgres://` URL is auto-normalized). Defaults to SQLite locally. |
| `SECRET_KEY` | ✅ prod | Signs JWTs. Use a long random value; the app warns if left at the dev default. |
| `ALLOWED_ORIGINS` | ✅ prod | JSON array or comma list of frontend origins. |
| `FRONTEND_URL` | ✅ prod | Base URL for shareable invite links. |
| `ENVIRONMENT` | – | `production` enables the secret-key warning. |
| `JWT_EXPIRES_SECONDS` | – | Session length (default 7 days). |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | – | Seeded demo login (`demo@zoom.clone` / `demo1234`). |
| `PORT` | – | Injected by the host; don't set manually. |

**Frontend** (see `frontend/.env.example`)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL. Inlined at build time — redeploy after changing it. |

---

## Verify the production deployment

1. **API health:** `GET https://<api>/health` → `{"status":"healthy"}`.
2. **Auth:** open the Vercel URL → you're redirected to `/login`. Sign in with `demo@zoom.clone` / `demo1234`, or create an account.
3. **Data loads:** the dashboard shows seeded meetings; `/contacts` shows the directory.
4. **Real-time:** open a meeting room in **two browser tabs** — presence, chat, and the whiteboard should sync. (Confirms WebSockets + auth work end-to-end.)
5. **No CORS errors** in the browser console (means `ALLOWED_ORIGINS` is correct).

---

## Notes & caveats

- **Use Postgres in production.** Free Railway/Render filesystems are ephemeral — a SQLite file is wiped on every redeploy. The schema is created and demo data seeded automatically on first boot (idempotent).
- **Free tiers sleep.** Render/Railway free instances cold-start after inactivity; the first request (and WebSocket connect) may take a few seconds.
- **Avatars** are stored inline as compact data-URLs in the DB (no object storage in this build) — fine at avatar size.
- **Demo seeding** runs on startup. To ship without sample data, remove the `seed_sample_data` / `seed_contacts` calls in `backend/app/main.py`.
- **Secrets:** rotate `SECRET_KEY` if it was ever committed; changing it invalidates existing sessions (everyone signs in again).
