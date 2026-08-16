# Auth Login Protect API

A lightweight authentication API built with Express and [Supabase Auth](https://supabase.com/docs/guides/auth). It exposes signup/login/logout routes backed by Supabase, a public endpoint, and JWT-protected endpoints guarded by a bearer-token middleware. Interactive API docs are served via Swagger UI.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Fill in the required environment variables:

   | Variable | Description |
   |---|---|
   | `SUPABASE_URL` | Your Supabase project URL (found in Project Settings → API). |
   | `SUPABASE_KEY` | Your Supabase project's anon/public API key. |
   | `PORT` | Port the server listens on (defaults to `3000` if unset). |

## Running

```bash
npm start
```

The server starts on `http://localhost:3000` (or your configured `PORT`). Interactive API documentation is available at `http://localhost:3000/docs`.

For local development with auto-restart on file changes, use `npm run dev` instead.

## API Reference

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| POST | `/auth/signup` | No | Create a new user account |
| POST | `/auth/login` | No | Log in and receive access and refresh tokens |
| POST | `/auth/logout` | Yes | Log out the current user |
| GET | `/public/info` | No | Public information endpoint |
| GET | `/protected/profile` | Yes | Get the authenticated user's profile |
| GET | `/protected/dashboard` | Yes | Get the authenticated user's dashboard |
| GET | `/health` | No | Health check |

Protected routes require an `Authorization: Bearer <access_token>` header, using the `access_token` returned from `/auth/login`.

## API Documentation

Swagger UI is served at `/docs` and lets you authorize with a bearer token to try protected routes directly in the browser.

![Swagger UI](docs/swagger-ui.png)
