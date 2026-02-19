# Realtime Chat (Full Stack)

Production-style real-time chat app with auth, friend system, private/group chat, file sharing, presence, and premium interactive UI.

## Tech Stack
- Frontend: React (Vite) + pure CSS + CSS variables
- Backend: Node.js + Express + Socket.IO
- DB: MongoDB + Mongoose
- Auth: JWT (HTTP-only cookie) + bcrypt
- Uploads: multer (images/files/voice)
- Validation: zod + server-side checks

## Project Structure
```text
realtime-chat/
  server/
    src/
      config/
      models/
      routes/
      middleware/
      sockets/
      controllers/
      utils/
      app.js
      server.js
    uploads/
    .env.example
    package.json
  client/
    src/
      api/
      components/
        layout/
        chat/
        friends/
        groups/
        ui/
      pages/
      hooks/
      styles/
      App.jsx
      main.jsx
    .env.example
    package.json
```

## Setup (Windows)

### 1) Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas account or local MongoDB

### 2) Server Setup
```powershell
cd server
copy .env.example .env
```

Set `MONGODB_URI` in `server/.env`.

Atlas template already included:
```text
mongodb+srv://menaganadar28_db_user:<db_password>@cluster0.qjmeqea.mongodb.net/realtime_chat
```

Install and run:
```powershell
npm install
npm run dev
```

### 3) Client Setup
```powershell
cd ..\client
copy .env.example .env
npm install
npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:4000`.

## Publish (Render)

This repo is ready to publish with Render Blueprint using `render.yaml` at the project root.

### 1) Push repository
Push this project to GitHub (or another Render-supported Git provider).

### 2) Create Blueprint in Render
- In Render dashboard: `New +` -> `Blueprint`
- Select your repo and branch
- Render will detect `render.yaml` and create:
  - `realtime-chat-api` (Node web service)
  - `realtime-chat-web` (static site)

### 3) Set required environment variables
After first deploy, update these values in Render:

- `realtime-chat-api`:
  - `MONGODB_URI` = your MongoDB Atlas/local production URI
  - `CLIENT_URL` = your frontend URL (for example `https://realtime-chat-web.onrender.com`)
  - Optional: `CLIENT_URLS` = comma-separated extra allowed origins (preview/staging URLs)

- `realtime-chat-web`:
  - `VITE_API_URL` = your backend URL (for example `https://realtime-chat-api.onrender.com`)

### 4) Redeploy both services
Redeploy after setting env vars so client and server use correct URLs.

### Notes for production auth/cookies
- Server cookie settings are now env-driven:
  - `COOKIE_SAME_SITE` (default `lax`, production should be `none` for cross-origin frontend/backend)
  - `COOKIE_SECURE` (set `true` in production with HTTPS)
- CORS allowlist supports `CLIENT_URL` and `CLIENT_URLS` (comma-separated).

## Seed Data
From `server/`:
```powershell
npm run seed
```

Creates:
- Users: `ava`, `noah`, `mia`
- Passwords: `Ava@1234`, `Noah@1234`, `Mia@1234`
- Friend request: `ava -> mia`
- Accepted friendship: `ava <-> noah`
- One private conversation + one group chat

## Implemented APIs
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Users/Friends:
  - `GET /api/users/search?query=`
  - `POST /api/friends/request`
  - `POST /api/friends/accept`
  - `POST /api/friends/reject`
  - `GET /api/friends/list`
- Private chat:
  - `POST /api/chats/private`
  - `GET /api/chats/private/:conversationId/messages`
- Groups:
  - `POST /api/groups/create`
  - `GET /api/groups/list`
  - `POST /api/groups/:groupId/add`
  - `POST /api/groups/:groupId/remove`
  - `POST /api/groups/:groupId/rename`
  - `GET /api/groups/:groupId/messages`
- Files:
  - `POST /api/upload`
  - `GET /api/uploads/:filename`

## Socket Events
- Presence: `users:online`, `user:status`
- Typing: `typing:start`, `typing:stop`
- Messaging: `message:send`, `message:new`
- Receipts: `message:read`, `message:receipt:update`
- Friends: `friend:request:new`, `friend:request:update`
- Rooms: `private:<conversationId>`, `group:<groupId>`

## Notes
- Private chat is restricted to accepted friends.
- Upload allowlist + size limit are enforced server-side.
- Message receipts are persisted (`sent` / `delivered` / `read`) and updated in realtime.
- Chat history supports cursor-based infinite scroll via `before` + `limit`.
- UI includes light/dark theme, accent picker, glassmorphism, animated typing dots, online pulse, skeletons, reconnect banner, custom scrollbar, and reduced-motion support.
