# Setup & Run Guide — StudyFlow

Follow these instructions to run and test StudyFlow locally.

## Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

---

## Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment (Optional)**:
   StudyFlow runs out-of-the-box using the browser's LocalStorage as its database engine. If you want to connect to a live Supabase PostgreSQL server, create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   ```
   *If these variables are omitted, the application will automatically run in the local developer fallback mode.*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open the browser to the address printed in the console (usually `http://localhost:5173`).

4. **Verify Production Build**:
   To test tree-shaking, packaging, and JS compiling, run:
   ```bash
   npm run build
   ```
   Preview the compiled build locally:
   ```bash
   npm run preview
   ```
