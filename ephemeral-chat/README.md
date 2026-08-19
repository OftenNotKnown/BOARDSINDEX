# Ephemeral Chat

This directory contains the full-stack chat application. The existing files in
the parent repository are preserved.

## Run with Supabase

1. Create a Supabase project or use the connected project.
2. Set `DATABASE_URL` to the Supabase PostgreSQL connection string. For an
   autoscaling host, prefer the Supabase pooler connection string.
3. Set `SESSION_SECRET` to a long random value.
4. Install dependencies and apply the schema:

   ```sh
   npm ci
   npm run db:push
   npm run build
   npm start
   ```

The server listens on `PORT` (default `5000`). The database schema is defined
in `shared/schema.ts`.

## GitHub hosting note

GitHub Pages can host static frontend files, but it cannot run this app's
Express backend, authentication, sessions, or database routes. Deploy this
directory to a Node-capable host and use GitHub as the source repository.

## GitHub Actions

The included workflow runs the TypeScript check and production build on pushes
that touch this application.