# Pixie Blooms E-commerce Platform

## Original Problem Statement
Admin panel and all works under firebase now do one thing, make admin panel only load from firebase and after admin changes etc add a publish button in top, when admin click publish make all firebase datas in to one json and upload that json to r2 and load json for users.

## Architecture
- **Frontend:** React + Vite + TypeScript
- **Database:** Firebase Realtime Database (for admin)
- **Storage:** Cloudflare R2 (for published user data)
- **Hosting:** Cloudflare Pages with Workers

## User Personas
1. **Admin:** Manages products, categories, orders, and site settings via Firebase
2. **Customer:** Views products from R2 published data

## Core Requirements
- [x] Admin panel loads data from Firebase
- [x] Publish button to sync Firebase data to R2
- [x] Users load data from R2 JSON
- [x] Fallback to Firebase if R2 data doesn't exist

## What's Been Implemented (Feb 7, 2026)
- Created `/api/publish-data.ts` - POST endpoint for publishing Firebase data to R2
- Created `/api/get-published-data.ts` - GET endpoint for fetching R2 data
- Added "Publish to Live" button in Admin panel
- Modified Home.tsx and Shop.tsx to load from R2 first
- Created `/src/utils/publishedData.ts` utility for R2 data fetching with caching

## Prioritized Backlog
### P0 (Critical)
- Deploy to Cloudflare Pages for R2 integration

### P1 (High)
- Add preview mode before publishing
- Add publish status indicator

### P2 (Nice to have)
- Version history for rollback
- Partial publish (only changed data)

## Next Tasks
1. Deploy to Cloudflare Pages
2. Test publish functionality in production
3. Monitor R2 storage usage
