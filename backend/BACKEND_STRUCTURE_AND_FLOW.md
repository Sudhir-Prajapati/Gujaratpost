# Gujarat Post Backend Structure And Flow

## 1. Backend Overview

This project does not have a separate Express, Nest, Laravel, or Django backend.
The backend is implemented inside the Next.js app using App Router route handlers.

Important framework note:

- Next.js version: `16.2.9`
- API route convention: `app/api/.../route.ts`
- Route handlers use Web `Request`/`Response` plus Next.js helpers like `NextRequest`, `NextResponse`, and `cookies()`.
- Local Next docs checked:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/02-guides/authentication.md`

The backend currently has three main responsibilities:

1. Authentication and session management.
2. Live data proxy routes for weather, markets, sports, TV live status, and YouTube videos.
3. Database access for users, sessions, and audit logs.

The news/articles/photos/videos content shown in the frontend is mostly local static/mock data from `data/index.ts`, not database-backed backend CRUD yet.

## 2. Full Project Structure

```txt
Gujarat-Post-main/
  app/
    api/
      auth/
        forgot-password/route.ts
        login/route.ts
        logout/route.ts
        refresh/route.ts
        register/route.ts
        reset-password/route.ts
      live/
        markets/route.ts
        sports/route.ts
        tv/route.ts
        weather/route.ts
        youtube/route.ts
    category/[slug]/
    epaper/
    news/[slug]/
    photos/
    search/
    shorts/
    videos/
    watch/
    globals.css
    layout.tsx
    loading.tsx
    page.tsx
  components/
    ads/
    layout/
    sections/
    ui/
  data/
    index.ts
  lib/
    utils.ts
  prisma/
    schema.prisma
  public/
  server/
    audit/
    auth/
    config/
    constants/
    database/
    middleware/
    repositories/
    services/
    types/
    utils/
    validators/
  types/
    index.ts
  middleware.ts
  next.config.ts
  package.json
  tsconfig.json
```

## 3. Backend File Structure

```txt
app/api/
  auth/
    register/route.ts         POST /api/auth/register
    login/route.ts            POST /api/auth/login
    logout/route.ts           POST /api/auth/logout
    refresh/route.ts          POST /api/auth/refresh
    forgot-password/route.ts  POST /api/auth/forgot-password
    reset-password/route.ts   POST /api/auth/reset-password
  live/
    youtube/route.ts          GET /api/live/youtube
    weather/route.ts          GET /api/live/weather
    tv/route.ts               GET /api/live/tv
    sports/route.ts           GET /api/live/sports
    markets/route.ts          GET /api/live/markets

server/
  audit/
    audit.service.ts          Writes audit log rows.
  auth/
    cookies.ts                Reads/writes auth cookies.
    jwt.ts                    Signs and verifies access JWTs.
    password.ts               Hashes and compares passwords.
    permissions.ts            Role and permission checks.
    rate-limit.ts             Redis-backed login rate limiting.
    refresh.ts                Refresh token generation and hashing.
    session.ts                Extra session helpers.
  config/
    auth.ts                   Token, cookie, rate-limit, password constants.
    database.ts               Prisma logging config.
    env.ts                    Environment validation using Zod.
  constants/
    permissions.ts            Permission strings and role-permission map.
    roles.ts                  Role constants and hierarchy.
  database/
    prisma.ts                 Prisma client singleton.
    seed.ts                   Creates initial SUPER_ADMIN account.
  middleware/
    auth.ts                   requireAuth helper for route handlers.
    permission.ts             requirePermission helper.
    role.ts                   requireRole helper.
  repositories/
    user.repository.ts        User database queries.
    session.repository.ts     Session database queries.
  services/
    auth.service.ts           Main auth business logic.
  types/
    auth.ts
    article.ts
  utils/
    crypto.ts                 Token/hash helpers.
    errors.ts                 AppError classes.
    logger.ts                 Logging helper.
    mail.ts                   Resend email provider.
    response.ts               API response helpers.
  validators/
    auth.validator.ts         Zod schemas for auth inputs.

middleware.ts                 Global Next middleware for /admin and /api/admin.
prisma/schema.prisma          MySQL schema for User, Session, AuditLog.
```

## 4. API Route Map

### Auth Routes

All auth routes are thin wrappers. They receive the request and call `AuthService`.

```txt
POST /api/auth/register
  app/api/auth/register/route.ts
  -> AuthService.register(req)

POST /api/auth/login
  app/api/auth/login/route.ts
  -> AuthService.login(req)

POST /api/auth/logout
  app/api/auth/logout/route.ts
  -> AuthService.logout(req)

POST /api/auth/refresh
  app/api/auth/refresh/route.ts
  -> AuthService.refresh(req)

POST /api/auth/forgot-password
  app/api/auth/forgot-password/route.ts
  -> AuthService.forgotPassword(req)

POST /api/auth/reset-password
  app/api/auth/reset-password/route.ts
  -> AuthService.resetPassword(req)
```

### Live Data Routes

```txt
GET /api/live/youtube
  Fetches YouTube RSS for a configured channel.
  Falls back to Invidious instances.
  Falls back again to local placeholder videos.

GET /api/live/weather
  Query params:
    city=Ahmedabad
    cities=Ahmedabad,Gandhinagar,Vadodara
  Uses Open-Meteo geocoding and forecast APIs.

GET /api/live/tv
  Checks the configured YouTube channel live page.
  Returns whether the channel appears live.

GET /api/live/sports
  Uses ESPN score feeds for cricket and football.

GET /api/live/markets
  Uses Yahoo Finance chart endpoints for Sensex, Nifty 50, Bank Nifty, and USD/INR.
```

## 5. Database Structure

Database provider: MySQL.

Prisma datasource:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Current models:

```txt
User
  id
  email
  passwordHash
  role
  status
  createdAt
  updatedAt
  sessions
  auditLogs

Session
  id
  userId
  tokenHash
  deviceName
  browser
  ipAddress
  country
  createdAt
  lastUsedAt
  expiresAt
  revokedAt

AuditLog
  id
  userId
  action
  ipAddress
  userAgent
  createdAt
```

Enums:

```txt
Role:
  SUPER_ADMIN
  EDITOR
  REPORTER
  SEO
  ADVERTISEMENT
  PHOTOGRAPHER

AccountStatus:
  ACTIVE
  SUSPENDED
  DELETED
  PENDING_VERIFICATION
```

Important current limitation:

- There are no Prisma models yet for articles, categories, photos, videos, ads, epapers, tags, authors, or media uploads.
- Frontend article/category/photo/video pages currently read from `data/index.ts`.

## 6. Environment Configuration

Environment variables are validated in `server/config/env.ts`.

Required:

```txt
DATABASE_URL
JWT_SECRET
```

Optional/defaulted:

```txt
REDIS_URL=http equivalent default: redis://localhost:6379
RESEND_API_KEY=""
RESEND_FROM_EMAIL=noreply@gujaratpost.com
RESEND_FROM_NAME=Gujarat Post
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

`JWT_SECRET` must be at least 32 characters.

## 7. Authentication Flow

### Register Flow

```txt
Client
  -> POST /api/auth/register
  -> app/api/auth/register/route.ts
  -> AuthService.register(req)
  -> req.json()
  -> RegisterSchema validation
  -> UserRepository.findByEmail(email)
  -> hashPassword(password)
  -> UserRepository.create(...)
  -> AuditService.logEvent("USER_REGISTERED")
  -> ApiCreated(...)
```

Result:

- Creates a user.
- Default role is `REPORTER` unless a role is supplied.
- Current service creates users with `status: "ACTIVE"`.
- Does not automatically log the user in.

### Login Flow

```txt
Client
  -> POST /api/auth/login
  -> AuthService.login(req)
  -> checkRateLimit(ip)
  -> LoginSchema validation
  -> UserRepository.findByEmail(email)
  -> comparePassword(password, user.passwordHash)
  -> check user.status === "ACTIVE"
  -> parse user-agent into browser/device
  -> generate refresh token
  -> hash refresh token
  -> SessionRepository.create(...)
  -> signAccessToken({ userId, email, role })
  -> setAuthCookies(accessToken, refreshToken, rememberMe)
  -> AuditService.logEvent("LOGIN_SUCCESS")
  -> resetRateLimit(ip)
  -> sendLoginNotificationEmail(...)
  -> ApiSuccess(user)
```

Cookies set:

```txt
access_token
  httpOnly
  sameSite: lax
  maxAge: 15 minutes

refresh_token
  httpOnly
  sameSite: lax
  maxAge: 7 days if rememberMe is true
```

### Refresh Flow

```txt
Client
  -> POST /api/auth/refresh
  -> AuthService.refresh(req)
  -> read refresh_token cookie
  -> hash refresh token
  -> SessionRepository.findByHash(tokenHash)
  -> reject if missing or expired
  -> reject if user inactive
  -> generate new refresh token
  -> delete old session
  -> create new session
  -> sign new access token
  -> setAuthCookies(newAccessToken, newRefreshToken, true)
  -> AuditService.logEvent("TOKEN_REFRESHED")
  -> ApiSuccess(user)
```

This is refresh token rotation.

### Logout Flow

```txt
Client
  -> POST /api/auth/logout
  -> AuthService.logout(req)
  -> read refresh_token cookie
  -> hash refresh token
  -> SessionRepository.findByHash(tokenHash)
  -> delete session if found
  -> AuditService.logEvent("LOGOUT_SUCCESS")
  -> clearAuthCookies()
  -> ApiSuccess(null)
```

### Forgot Password Flow

```txt
Client
  -> POST /api/auth/forgot-password
  -> AuthService.forgotPassword(req)
  -> ForgotPasswordSchema validation
  -> UserRepository.findByEmail(email)
  -> if active user exists:
       generate secure token
       sha256(token)
       redis.set("pwd_reset:<hash>", user.id, expiry)
       sendPasswordResetEmail(email, rawToken)
       AuditService.logEvent("PASSWORD_RESET_REQUESTED")
  -> always return success message
```

This avoids email enumeration because the response is the same whether the user exists or not.

### Reset Password Flow

```txt
Client
  -> POST /api/auth/reset-password
  -> AuthService.resetPassword(req)
  -> ResetPasswordSchema validation
  -> sha256(token)
  -> redis.get("pwd_reset:<hash>")
  -> reject if missing
  -> hash new password
  -> UserRepository.update(userId, { passwordHash })
  -> redis.del("pwd_reset:<hash>")
  -> SessionRepository.deleteAllForUser(userId)
  -> clearAuthCookies()
  -> AuditService.logEvent("PASSWORD_RESET_SUCCESS")
  -> ApiSuccess(null)
```

All sessions are invalidated after reset.

## 8. Authorization And Admin Protection

There are two protection layers.

### Global `middleware.ts`

Protects:

```txt
/admin/:path*
/api/admin/:path*
```

Flow:

```txt
Request to /admin or /api/admin
  -> read access_token cookie
  -> verify JWT using jose
  -> if no token:
       API route returns 401
       page route redirects to /login?from=<path>
  -> check role path permissions
  -> if allowed:
       attach headers:
         x-user-id
         x-user-email
         x-user-role
       continue
  -> if not allowed:
       API route returns 403
       page route redirects to /unauthorized
```

Current path permissions:

```txt
SUPER_ADMIN    -> /admin
EDITOR         -> /admin/articles, /admin/categories, /admin/gallery
REPORTER       -> /admin/articles
SEO            -> /admin/seo
ADVERTISEMENT -> /admin/ads
PHOTOGRAPHER  -> /admin/gallery
```

Important current limitation:

- No `/admin` pages or `/api/admin` route handlers are present yet.
- Middleware is prepared for admin/backend expansion, but the routes are not implemented.

### Route Handler Helpers

These helpers are ready for future protected route handlers:

```txt
server/middleware/auth.ts
  requireAuth(req)

server/middleware/role.ts
  requireRole(req, minimumRole)

server/middleware/permission.ts
  requirePermission(req, permission)
```

Permission map lives in:

```txt
server/constants/permissions.ts
```

## 9. Live API Flow

### YouTube Latest Videos

Frontend usage:

```txt
components/sections/YouTubeLatest.tsx
  -> fetch("/api/live/youtube")
```

Backend flow:

```txt
/api/live/youtube
  -> fetch YouTube RSS feed
  -> parse XML entries using regex
  -> return latest 6 videos
  -> if RSS fails:
       try multiple Invidious API instances
  -> if all fail:
       return fallback video list
```

### Weather

Frontend usage:

```txt
components/sections/LiveDashboard.tsx
components/sections/HeroSection.tsx
  -> fetch("/api/live/weather")
```

Backend flow:

```txt
/api/live/weather?city=Ahmedabad
/api/live/weather?cities=Ahmedabad,Gandhinagar,Vadodara
  -> Open-Meteo geocoding API
  -> choose Indian result
  -> Open-Meteo forecast API
  -> return temperature, humidity, rain chance, wind speed, condition
```

### TV Live Status

Frontend usage:

```txt
components/sections/HeroSection.tsx
  -> fetch("/api/live/tv")
```

Backend flow:

```txt
/api/live/tv
  -> fetch YouTube channel live page
  -> scan HTML for live markers
  -> return { isLive, error, checkedAt }
```

### Sports

Frontend usage:

```txt
components/sections/LiveDashboard.tsx
  -> fetch("/api/live/sports")
```

Backend flow:

```txt
/api/live/sports
  -> ESPN cricket feed
  -> ESPN football feeds
  -> normalize cricket and football events
  -> return live/scheduled/recent event data
```

### Markets

Frontend usage:

```txt
components/sections/LiveDashboard.tsx
  -> fetch("/api/live/markets")
```

Backend flow:

```txt
/api/live/markets
  -> Yahoo Finance chart API
  -> Sensex, Nifty 50, Bank Nifty, USD/INR
  -> calculate change and change percent
  -> return normalized market data
```

## 10. Frontend Data Flow For Content

Most news content comes from:

```txt
data/index.ts
```

This file exports:

```txt
AUTHORS
CATEGORY_META
ARTICLES
VIDEOS
PHOTOS
BREAKING_TICKER
NAV_ITEMS
getArticlesByCategory()
getTrendingArticles()
getFeaturedArticles()
getRelatedArticles()
searchArticles()
formatDate()
formatTime()
formatViews()
```

Common page flow:

```txt
app/page.tsx
  -> uses sections/components
  -> components use data/index.ts and live API routes

app/category/[slug]/page.tsx
  -> category client component
  -> reads category/articles from data/index.ts

app/news/[slug]/page.tsx
  -> news detail client component
  -> finds article from data/index.ts

app/photos/page.tsx and app/photos/[id]/page.tsx
  -> reads PHOTOS from data/index.ts

app/videos/page.tsx, app/shorts/page.tsx, app/watch/page.tsx
  -> reads VIDEOS/static data and live APIs depending on component
```

This means the frontend looks like a news portal, but the persistent CMS backend is not built yet.

## 11. Seed Flow

Seeder file:

```txt
server/database/seed.ts
```

Purpose:

```txt
Creates initial SUPER_ADMIN account.
Default email: admin@gujaratpost.com
Default password: Admin@123456
```

Expected command from file comment:

```bash
npx ts-node server/database/seed.ts
```

Note:

- `ts-node` is not currently listed in `package.json`.
- To run this as-is, the project may need `ts-node` installed or a different seed runner.

## 12. Current Backend Gaps

These are not implemented yet:

```txt
Article CRUD APIs
Category CRUD APIs
Author CRUD APIs
Photo/media upload APIs
Video CRUD APIs
E-paper upload/list APIs
Advertisement APIs
SEO/settings APIs
Admin dashboard pages
/api/admin route handlers
Database models for content
File/object storage integration
```

The code already has roles, permissions, and middleware prepared for many of these future modules.

## 13. Suggested Backend Expansion Order

Recommended next backend build order:

1. Add Prisma models for articles, categories, authors, media, videos, ads, and epapers.
2. Add repositories for each model under `server/repositories`.
3. Add services under `server/services`.
4. Add Zod validators under `server/validators`.
5. Add protected route handlers under `app/api/admin/...`.
6. Use `requireAuth`, `requireRole`, or `requirePermission` inside those route handlers.
7. Replace frontend reads from `data/index.ts` with API/database-backed reads.
8. Keep `data/index.ts` only for fallback/demo content or remove it after migration.

## 14. Mental Model

Use this simple model when working in the repo:

```txt
Browser/UI
  -> app pages and components
  -> app/api route handlers
  -> server/services
  -> server/repositories
  -> Prisma
  -> MySQL

External live data:
Browser/UI
  -> app/api/live route handlers
  -> external provider APIs
  -> normalized JSON response

Authentication:
Browser
  -> auth route
  -> AuthService
  -> UserRepository/SessionRepository
  -> access_token + refresh_token HTTP-only cookies
  -> middleware protects /admin and /api/admin
```

## 15. One-Line Summary

The current backend is a Next.js App Router backend-for-frontend with a solid auth/session foundation, Redis-backed rate limiting/password reset support, Prisma/MySQL user/session/audit tables, and several live proxy APIs; the actual CMS/news database backend is still pending and the frontend currently relies on `data/index.ts` for content.
