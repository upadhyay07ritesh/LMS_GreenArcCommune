# Green Arc Commune LMS (MERN)

Monorepo for a full-stack Learning Management System.

- Server: Express.js + MongoDB (Mongoose)
- Client: React + Vite + Redux Toolkit + React Router + Tailwind CSS

## Quick Start

1) Server setup
- Copy `server/.env.example` to `server/.env` and fill values
- Install deps and run dev server

```bash
# From repo root
npm install --prefix server
npm run dev --prefix server
```

2) Client setup
- Install deps and run dev server

```bash
# From repo root
npm install --prefix client
npm run dev --prefix client
```

## .env (server)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/greenarc_lms
JWT_SECRET=supersecretjwtkey
CORS_ORIGIN=http://localhost:5173
```

## Scripts
- Seed initial admin user (email: admin@greenarc.com / password from env)
```bash
npm run seed:admin --prefix server
```

## Roles
- Student: can view enrolled courses, content, track progress
- Admin: manage courses and students

## Structure
- `server/` Node/Express API
- `client/` React frontend
