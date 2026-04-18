# Code Review Rules

## TypeScript
- Use const/let, never var
- Prefer interfaces over types
- Avoid `any` - use `unknown` or proper types
- Use `as` type assertions only when necessary

## React
- Use functional components with arrow functions
- Prefer named exports
- Use Server Components by default, Client Components only when needed ('use client')
- Keep components small and focused

## Next.js
- Use App Router (src/app)
- Route groups: (parent) for dashboard, (student) for island pages
- Server actions in lib/actions or _shared

## Supabase
- Use SSR helpers from @supabase/ssr
- Prefer server components for data fetching
- Use RLS policies for security

## Styling
- Tailwind CSS - use utility classes
- Follow existing color tokens: tinku-ink, tinka-sea, tinka-mist, etc.

## General
- No console.log in production
- Add proper error handling
- Write meaningful commit messages (conventional commits)