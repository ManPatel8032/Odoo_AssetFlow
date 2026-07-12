# AssetFlow

AssetFlow is a comprehensive asset management platform built with Next.js, Tailwind CSS, and Supabase.

## Project Structure

The repository is now divided into two main parts:
- `frontend/` - Next.js App, Tailwind CSS, components, and UI logic.
- `backend/` - Supabase configurations, migrations, seed scripts, and Edge Functions.

## Running Locally

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `frontend/.env.local`
4. Run the development server:
   ```bash
   npm run dev
   ```

### Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Use the Supabase CLI to start services:
   ```bash
   supabase start
   ```
