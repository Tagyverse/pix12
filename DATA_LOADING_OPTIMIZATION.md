# Data Loading Optimization Guide

## Overview
The app now has comprehensive optimizations for loading data from R2 (for users) with fallback to Firebase (if R2 data is not available). All data is loaded once and cached for performance.

## Data Loading Flow

### 1. **PublishedDataContext** (Global State)
- Runs once when app loads
- Loads published data from R2 via `/api/get-published-data`
- Falls back to Firebase if R2 fails
- Provides data to entire app via context

### 2. **Home Page** (Uses Published Data)
- Subscribes to PublishedDataContext
- Loads all homepage sections:
  - Featured products
  - Categories
  - Carousel images & settings
  - Dynamic sections
  - Info sections
  - Marquee sections
  - Video sections
  - Navigation settings

### 3. **Navigation Component** (Uses Published Data)
- Loads navigation_settings from published data
- Has built-in defaults if data is missing
- Never shows null values

## Performance Features

### 📊 Progress Indicator
- Shows 0-100% progress while loading
- Located in PageLoader component
- Displays loading tips during progress

### ⚡ Data Caching
- Caches R2 data for 5 minutes (300,000ms)
- Skips fetch if cache is still valid
- Improves subsequent page loads significantly

### 🔄 Fallback Chain
1. **First Choice**: Cached R2 data (fastest)
2. **Second Choice**: Fresh R2 data from API
3. **Third Choice**: Firebase data (if R2 unavailable)
4. **Last Resort**: Empty state with Coming Soon page

### 📱 Optimized Fetch
- 15-second timeout on R2 requests
- AbortController for cancellation
- Browser cache headers for optimal CDN caching
- Parallel Firebase fallback loading

### 🎨 Smooth Scrolling
- CSS `scroll-behavior: smooth` enabled
- All navigation scrolls smoothly
- Improved UX for section navigation

## Key Components

### PageLoader Component
```tsx
<PageLoader 
  isVisible={isLoading}
  progress={progressPercent}
  message="Loading Pixie Blooms..."
/>
```
- Shows while initial data loads
- Displays progress bar
- Auto-hides when complete

### useOptimizedDataLoad Hook
- Custom hook for optimized data loading
- Tracks 4 loading states:
  - `isLoading`: Initial data fetch
  - `isNavigationReady`: Navigation can display
  - `isContentReady`: All content loaded
  - `progress`: 0-100%

### Navigation Settings
The navigation now:
- Loads colors, fonts, button labels from R2
- Has fallback defaults if missing:
  - Background: white (#ffffff)
  - Text: gray (#111827)
  - Active tab: teal (#14b8a6)
  - Button labels: Home, Shop All, Search, etc.

## Data Structure in R2

All published data is stored in R2 as a single JSON file containing:

```json
{
  "products": { /* Product records */ },
  "categories": { /* Category records */ },
  "navigation_settings": { /* Navigation styles */ },
  "carousel_images": { /* Carousel images */ },
  "carousel_settings": { /* Carousel config */ },
  "homepage_sections": { /* Custom sections */ },
  "info_sections": { /* Info sections */ },
  "marquee_sections": { /* Marquee sections */ },
  "video_sections": { /* Video sections */ },
  "video_overlay_sections": { /* Video overlays */ },
  "default_sections_visibility": { /* Section toggles */ },
  "footer_settings": { /* Footer config */ },
  "policies": { /* Policy pages */ },
  /* ... and more */
}
```

## Publishing Data

### From Admin Panel
1. Go to **Admin → Publish to Live** tab
2. Click **"Publish to Live"** button
3. Wait for upload confirmation
4. Publishing automatically:
   - Collects all Firebase data
   - Creates navigation_settings defaults if missing
   - Uploads to R2
   - Clears client-side cache

### Cache Clearing
The cache is automatically cleared after publishing:
```ts
clearPublishedDataCache(); // Clears 5-minute cache
```

## Troubleshooting

### Navigation shows null
**Solution**: 
1. Check Firebase has `navigation_settings` or `navigation/style`
2. Go to Admin → Publish to Live
3. Click "Publish to Live" to update R2
4. Refresh page

### Slow loading
**Possible causes**:
1. R2 data not published (falls back to Firebase)
2. Firebase read permissions issue
3. Network connectivity

**Solutions**:
1. Publish data from Admin panel
2. Check Firebase rules allow reads
3. Check network speed

### Data not updating
**Solution**:
1. Data is cached for 5 minutes
2. In preview mode (`?preview=true`), cache is bypassed
3. Publishing clears cache for all users
4. Manual cache clear: `clearPublishedDataCache()`

## Console Logs

Monitor loading progress in browser DevTools:

```
[DATA-CONTEXT] Normal mode: Loading from R2
[R2] Fetching published data from R2...
[R2] ✓ Data loaded in 245ms
[R2] ✓ Found 28 data sections
[R2] ✓ Cache updated
[HOME] Published data loaded successfully
[HOME] Data loading complete
```

## Performance Metrics

- **First Load**: 2-4 seconds (includes R2 fetch + rendering)
- **Cached Load**: <500ms (instant from cache)
- **Published Data Upload**: 1-3 seconds
- **R2 Fetch Timeout**: 15 seconds (falls back to Firebase)

## Security

- R2 data is read-only for users
- Only admin can publish data
- Firebase remains source of truth for admin edits
- User pages load published snapshot (safe from live edits)

---

**Last Updated**: February 2026
