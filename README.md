# School Management System

A modern School Management System web application built with a FastAPI backend and a React Router frontend.

## Project Structure

```text
school-management-system/
├── backend/            # FastAPI Python backend
│   ├── app/
│   │   ├── database.py # SQLAlchemy connection configuration & health check
│   │   └── main.py     # Main FastAPI application & lifespan management
│   ├── .env            # Backend environment variables
│   ├── .venv/          # Python virtual environment
│   └── requirements.txt
├── frontend/           # React Router v8 + TailwindCSS frontend
│   ├── app/            # React application source code
│   ├── package.json    # Frontend dependency list and scripts
│   └── tsconfig.json
├── package.json        # Root package.json with scripts to control both projects
└── README.md           # Project documentation
```

---

## Prerequisites

Before running this project, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **Python** (v3.10 or higher recommended)
- **PostgreSQL** database running locally or remotely

---

## Getting Started

### 1. Database Configuration

Create a PostgreSQL database named `school-management-system`. Ensure the connection URL in the backend configuration matches your local instance.

The backend expects a `.env` file at [backend/.env](file:///Applications/Programing/Personal/school-management-system/backend/.env):
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/school-management-system"
JWT_SECRET="your-secret-key"

# Cloudinary (required for organization logo uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 2. Startup Command Scripts

You can run commands from the **root directory** of the workspace to start the frontend or backend servers.

#### Run Frontend
Starts the React Router development server (runs `npm run dev` in the `frontend` folder):
```bash
npm run frontend
```

#### Run Backend
Starts the FastAPI backend development server (using uvicorn in the virtual environment):
```bash
npm run backend
```

---

## Technical Details

### Backend (FastAPI)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database Driver**: `psycopg2-binary`
- **Configuration**: Loads variables from `.env` via `python-dotenv`.
- **Health Check**: When you start the backend, it tests database connectivity automatically and prints:
  `Database run correctly` to the terminal console.

### Frontend (React Router + TailwindCSS)
- **Framework**: [React Router v8](https://reactrouter.com/) (formerly Remix)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vite.dev/)
