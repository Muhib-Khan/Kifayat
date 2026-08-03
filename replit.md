# Kifayat

A full-stack e-commerce / dropshipping platform (HHC Dropshipping integration) built with Node.js/Express (backend) and React/Vite (frontend).

## Stack

- **Frontend:** React 19, Vite, TypeScript, TanStack Router + Query, Tailwind CSS v4, Framer Motion, Radix UI
- **Backend:** Node.js, Express v5, MongoDB (Mongoose), Socket.io, Firebase Admin SDK
- **Email:** Resend (OTP / transactional)
- **Auth:** Firebase (Google OAuth) + local JWT (email/OTP)
- **AI:** Groq SDK

## Structure

```
kifayat-backend/   — Express API, port 3001
kifayat-frontend/  — Vite dev server, port 5000
```

## Running in the workspace

The workspace has two convenience workflows:

| Workflow | Command | Port |
|----------|---------|------|
| Backend  | `cd kifayat-backend && npm install && PORT=3001 node server.js` | 3001 |
| Frontend | `cd kifayat-frontend && npm install --include=dev && npm run dev` | 5000 |

The frontend is available on port **5000** when running locally.

## Environment variables

For local VS Code development, copy the tracked `.env.example` files into
ignored `.env` / `.env.local` files. For hosted environments, set the same
values through that host's environment-variable manager. Sensitive secrets
required:

| Secret | Purpose |
|--------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing key |
| `RESEND_API_KEY` | Email / OTP delivery |
| `EMAIL_PASS` | Gmail app password (fallback mailer) |
| `SESSION_SECRET` | Express session |

For emailed order-confirmation links, set `PUBLIC_APP_URL` to the public URL
customers can open. If it is not set, the backend derives the URL from the
incoming request, which works with local development and reverse proxies.

## Known gaps

- **Secrets:** `MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY`, and `EMAIL_PASS` must be supplied through your host's environment-variable manager or local ignored `.env` file. Keep them out of committed files.
- **Firebase service account:** `kifayat-backend/firebase-service-account.json` is present and Firebase Admin initializes correctly.
- **Downloadable configuration templates:** use `kifayat-backend/.env.example` and `kifayat-frontend/.env.example`. Real `.env` files stay ignored so database, auth, email, Firebase, HHC, and Groq credentials are not committed.
- **Groq product copy:** `GROQ_API_KEY` enables description optimization during CSV imports, HHC imports, and re-categorization; the original description is retained if Groq is unavailable.

## User preferences

- Keep monorepo structure (kifayat-backend / kifayat-frontend) intact.
