# AssetFlow

AssetFlow is a comprehensive asset management platform built with Next.js, Tailwind CSS, and an Express.js backend with PostgreSQL.

## Project Structure

The repository is divided into two main parts:
- `frontend/` - Next.js App, Tailwind CSS, components, and UI logic.
- `backend/` - Node.js/Express server and `db/` containing raw SQL scripts.

## Running Locally

### Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables by creating `backend/.env` containing your database URL:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/postgres"
   PORT=5000
   ```
4. Start the Express server:
   ```bash
   npm run dev
   ```

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
