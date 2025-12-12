# Monorepo Structure

This is a simple monorepo with two main directories:

## Backend

Located in `backend/` - A Node.js Express server

### Setup
```bash
cd backend
npm install
```

### Run
- Development: `npm run dev` (watches for changes)
- Production: `npm start`

The server runs on `http://localhost:3001` by default and provides an API endpoint at `/api/hello`.

## Frontend

Located in `frontend/` - A React application using Vite

### Setup
```bash
cd frontend
npm install
```

### Run
- Development: `npm run dev` (runs on http://localhost:3000 with HMR)
- Build: `npm run build`
- Preview: `npm run preview`

The frontend is configured with a proxy to forward API calls to the backend.

## Getting Started

1. Install dependencies in both directories:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Start the backend server:
   ```bash
   cd backend && npm run dev
   ```

3. In another terminal, start the frontend development server:
   ```bash
   cd frontend && npm run dev
   ```

4. Open http://localhost:3000 in your browser to see the frontend, which can communicate with the backend API.
