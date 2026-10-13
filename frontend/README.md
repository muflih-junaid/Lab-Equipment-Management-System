# Lab Equipment website frontend

React, React Router, Vite, and Tailwind CSS. See the [repository README](../README.md) for database setup, backend configuration, and complete website instructions.

Run from this folder:

```bash
npm ci
npm run dev
```

Vite proxies `/api` to `http://localhost:5000`. An optional `VITE_API_URL` environment variable overrides this; see `.env.example`.

```bash
npm run lint
npm run build
```

Login and registration keep the original authentication layout. Authenticated pages use a responsive sidebar, role-based navigation, cards, tables, forms, status badges, and loading/error/empty feedback. API requests share the client in `src/api/client.js`; authentication context restores the session through `/auth/me`.
