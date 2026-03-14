# BeeSeek - Development & Deployment Guide

## Architecture Overview

**BeeSeek is a B2B2C mobile application** that connects Clients with Agents through a shared backend.

```
BeeSeek-Client (React Native/Expo) ─┐
                                     ├─→ Shared Backend (Nest.js) ─→ PostgreSQL
BeeSeek-Agent (React Native/Expo)  ─┘
```

Both mobile apps communicate with **one shared backend** and **one shared database**. Users authenticate as either a Client or an Agent role.

---

## Local Development Setup (100% FREE)

### Step 1: Install Required Tools

**macOS:**
```bash
# Node.js (if not installed)
brew install node

# PostgreSQL
brew install postgresql@15

# Redis
brew install redis
```

**Or use Docker (simpler):**
```bash
# PostgreSQL
docker run --name beeseek-postgres \
  -e POSTGRES_PASSWORD=dev_password \
  -d -p 5432:5432 \
  postgres:15

# Redis
docker run --name beeseek-redis \
  -d -p 6379:6379 \
  redis:latest
```

### Step 2: Create Accounts (All FREE Tier)

1. **Cloudinary** (File Uploads)
   - Sign up: https://cloudinary.com
   - Get: `CLOUD_NAME`, `API_KEY`, `API_SECRET`
   - Free: 25GB/month storage

2. **Firebase** (Push Notifications)
   - Sign up: https://firebase.google.com
   - Create new project
   - Download service account JSON key
   - Free: Unlimited push notifications

3. **Monnify** (Wallet/Payments)
   - Sign up: https://monnify.com
   - Use **Sandbox/Test mode** for development
   - No real money charged during testing

### Step 3: Create Backend Project

```bash
# Create new Nest.js project
npm i -g @nestjs/cli
nest new beeseek-backend
cd beeseek-backend

# Install core dependencies
npm install \
  @nestjs/typeorm \
  typeorm \
  pg \
  redis \
  socket.io \
  @nestjs/websockets \
  @nestjs/platform-socket.io \
  bcrypt \
  jsonwebtoken \
  @types/bcrypt \
  @types/jsonwebtoken \
  helmet \
  express-rate-limit \
  cloudinary \
  axios \
  bull \
  @nestjs/bull \
  firebase-admin \
  axios-retry \
  class-validator \
  class-transformer

npm install --save-dev @types/node @types/express
```

### Step 4: Create Database

```bash
# Using psql
createdb beeseek_db

# Or with Docker
docker exec beeseek-postgres psql -U postgres -c "CREATE DATABASE beeseek_db;"
```

### Step 5: Create `.env` File

Create `beeseek-backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/beeseek_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=dev_password
DB_NAME=beeseek_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key_here"
FIREBASE_CLIENT_EMAIL=your_service_account_email

# Monnify (Sandbox/Test)
MONNIFY_API_KEY=your_monnify_api_key
MONNIFY_SECRET_KEY=your_monnify_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_SANDBOX_MODE=true

# Environment
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
```

### Step 6: Create Project Structure

```bash
mkdir -p src/modules/{auth,users,chat,uploads,wallet,location,notifications,sync}
mkdir -p src/common/{decorators,guards,pipes,interceptors,strategies}
mkdir -p src/config
mkdir -p src/entities
mkdir -p src/dto
```

---

## Recommended Project Structure

```
beeseek-backend/
├── src/
│   ├── modules/
│   │   ├── auth/                    # JWT, Social login, Auth Guard
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                   # User profiles (Client/Agent)
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── user.entity.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── chat/                    # Real-time messaging via Socket.io
│   │   │   ├── chat.gateway.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── message.entity.ts
│   │   │   └── chat.module.ts
│   │   │
│   │   ├── uploads/                 # Cloudinary integration
│   │   │   ├── uploads.controller.ts
│   │   │   ├── uploads.service.ts
│   │   │   ├── upload.entity.ts
│   │   │   └── uploads.module.ts
│   │   │
│   │   ├── wallet/                  # Monnify integration
│   │   │   ├── wallet.controller.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── monnify.service.ts
│   │   │   └── wallet.module.ts
│   │   │
│   │   ├── location/                # Geo-filtering, nearby users
│   │   │   ├── location.controller.ts
│   │   │   ├── location.service.ts
│   │   │   └── location.module.ts
│   │   │
│   │   ├── notifications/           # Firebase FCM push notifications
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── firebase.service.ts
│   │   │   └── notifications.module.ts
│   │   │
│   │   └── sync/                    # Offline-first sync endpoint
│   │       ├── sync.controller.ts
│   │       ├── sync.service.ts
│   │       ├── idempotency.service.ts
│   │       └── sync.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── user.decorator.ts       # @CurrentUser()
│   │   │   └── role.decorator.ts       # @Roles('CLIENT', 'AGENT')
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── websocket.guard.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── response.interceptor.ts
│   │   │
│   │   ├── exceptions/
│   │   │   ├── custom.exception.ts
│   │   │   └── exception.filter.ts
│   │   │
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── cloudinary.config.ts
│   │   ├── firebase.config.ts
│   │   └── monnify.config.ts
│   │
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── message.entity.ts
│   │   ├── transaction.entity.ts
│   │   └── ...
│   │
│   ├── dto/
│   │   └── (request/response dtos)
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── .env                            # Local development
├── .env.example                    # Template (commit to git)
├── package.json
├── tsconfig.json
└── docker-compose.yml              # (Optional) for local postgres/redis
```

### Step 7: Start Development

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd beeseek-backend
npm run start:dev

# Backend runs at http://localhost:3000
```

### Step 8: Start Mobile Apps

```bash
# Terminal 3: Start BeeSeek-Client
cd BeeSeek-Client
npm install
npm start

# Terminal 4: Start BeeSeek-Agent
cd BeeSeek-Agent
npm install
npm start
```

---

## Key Implementation Notes

### Offline-First Architecture

Your mobile apps can queue requests locally using **SQLite/Realm** when offline:

```typescript
// On mobile app
if (isOnline) {
  await api.post('/sync', {
    requests: queuedRequests,
    clientId: deviceId
  });
} else {
  // Store in local SQLite queue
  await db.saveToQueue(request);
}
```

Backend processes batches and handles idempotency:

```typescript
// Backend
@Post('/sync')
async sync(@Body() syncPayload: SyncDto) {
  for (const request of syncPayload.requests) {
    const idempotencyKey = `${request.clientId}_${request.requestId}`;
    
    // Check if already processed
    const cached = await this.redis.get(idempotencyKey);
    if (cached) return cached;
    
    // Process request
    const result = await this.processRequest(request);
    
    // Cache result
    await this.redis.setex(idempotencyKey, 3600, result);
    
    return result;
  }
}
```

### Real-Time Updates

Socket.io broadcasts updates to connected clients:

```typescript
// Client connects
socket.on('connect', () => {
  socket.emit('authenticate', { token });
  socket.emit('subscribe', { room: 'chat_123' });
});

// Backend broadcasts
@SubscribeMessage('message')
handleMessage(client, data) {
  this.server.to(`chat_${data.chatId}`).emit('message:new', data);
}
```

### User Roles (Client vs Agent)

```typescript
// User Entity
@Entity()
export class User {
  @Column({ type: 'enum', enum: ['CLIENT', 'AGENT'] })
  role: 'CLIENT' | 'AGENT';
}

// Use in guards
@Get('/my-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENT', 'AGENT')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

---

## Going Live - Deployment Steps

### When You're Ready (Week 4-6):

#### 1. Choose Hosting (Railway Recommended)

Go to **https://railway.app**

- Sign up with GitHub
- Create new project
- Add PostgreSQL plugin
- Add Redis plugin
- Deploy Nest.js backend via GitHub

#### 2. Update Environment Variables

In Railway dashboard, set production `.env`:

```env
DATABASE_URL=postgresql://user:pass@railway-db:5432/beeseek_db
REDIS_URL=redis://:@railway-redis:6379
JWT_SECRET=your_production_secret_key
NODE_ENV=production
API_URL=https://your-railway-app.railway.app
# Keep Cloudinary, Firebase, Monnify same (already cloud-based)
MONNIFY_SANDBOX_MODE=false  # Enable live mode
```

#### 3. Deploy Mobile Apps

**iOS (Apple App Store):**
- Create Apple Developer account ($99/year)
- Build release: `eas build --platform ios --auto-submit`
- Submit to App Store

**Android (Google Play):**
- Create Google Play Developer account ($25 one-time)
- Build release: `eas build --platform android`
- Submit to Play Store

See: https://docs.expo.dev/deploy/build-signing/

#### 4. Database Migration

```bash
# Run migrations in production
npm run typeorm migration:run -- -d dist/config/database.config.js
```

#### 5. DNS/Domain (Optional)

If you want custom domain:
- Buy domain from Namecheap/GoDaddy
- Point to Railway's provided URL or custom domain feature

#### 6. Monitoring & Backups

```bash
# Railway automatically handles backups
# But set up manual backups via pg_dump
pg_dump postgresql://user:pass@remote-db/db > backup.sql
```

#### 7. Enable Live Monnify

- Contact Monnify
- Switch from Sandbox to Live
- Update credentials in Railway

---

## Cost Summary

### Development Phase: $0
- All services free tier
- Local databases

### Production Phase: ~$10-15/month
| Service | Cost | Notes |
|---------|------|-------|
| Railway (Backend + DB + Redis) | $5-10 | Pay-as-you-go |
| Cloudinary | Free | 25GB free tier |
| Firebase | Free | Free tier sufficient |
| Monnify | Variable | 1-2% per transaction |
| **Total** | **~$5-15** | Scales with usage |

---

## Quick Reference Commands

```bash
# Local Development
docker run -d --name pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis
npm run start:dev

# Database
npm run typeorm migration:generate -- -n InitSchema
npm run typeorm migration:run

# Deployment
git push origin main  # Railway auto-deploys via GitHub

# Production Debugging
npm run logs:prod    # Check Railway logs
npm run db:backup    # Backup production database
```

---

## Checklist Before Going Live

- [ ] All tests passing
- [ ] Cloudinary production setup
- [ ] Firebase production project configured
- [ ] Monnify sandbox testing complete
- [ ] Database migrations tested
- [ ] Rate limiting configured
- [ ] Error logging enabled (Sentry)
- [ ] Environment variables locked down
- [ ] HTTPS/SSL enabled (Railway handles this)
- [ ] Backups configured
- [ ] Alert/monitoring setup

---

## Support Resources

- **Nest.js Docs**: https://docs.nestjs.com
- **TypeORM Docs**: https://typeorm.io
- **Socket.io**: https://socket.io/docs
- **Railway Docs**: https://docs.railway.app
- **Cloudinary**: https://cloudinary.com/documentation
- **Firebase**: https://firebase.google.com/docs
- **Monnify**: https://docs.monnify.com

---

**Questions?** Check this guide first, then reach out to the team.
