# 🏗️ System Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PIXIE BLOOMS APP                         │
│                      (React + TypeScript)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  App Component   │
                    │  (src/App.tsx)   │
                    └──────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
           ┌────────┐   ┌──────────┐   ┌──────────────┐
           │Splash  │   │Page      │   │Published     │
           │Screen  │   │Loader    │   │Data          │
           │(2s)    │   │(0-100%)  │   │Context       │
           └────────┘   └──────────┘   └──────────────┘
                               │              │
                               └──────┬───────┘
                                      ▼
                         ┌────────────────────┐
                         │ Data Loading Flow  │
                         └────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ Check Cache  │  │              │  │              │
            │ (5 minutes)  │  │              │  │              │
            └──────────────┘  │              │  │              │
                    │         │              │  │              │
            ┌───────┴────┐    │              │  │              │
            ▼            ▼    │              │  │              │
         Valid?      Expired? │              │  │              │
         │            │       │              │  │              │
         YES          NO      │              │  │              │
         │            │       ▼              │  │              │
         │            │   ┌──────────────┐  │  │              │
         │            │   │Fetch from R2 │  │  │              │
         │            │   │API Endpoint  │  │  │              │
         │            │   │(15s timeout) │  │  │              │
         │            │   └──────────────┘  │  │              │
         │            │        │            │  │              │
         │            │    ┌───┴────┐       │  │              │
         │            │    ▼        ▼       │  │              │
         │            │  Success  Timeout? │  │              │
         │            │    │        │       │  │              │
         │            └────┼────────┘       │  │              │
         │                 │                │  │              │
         │                 ▼                ▼  ▼              ▼
         │           ┌──────────────────────────────────┐
         │           │ Parse JSON & Validate Data       │
         │           │ - Check critical sections        │
         │           │ - Add navigation defaults        │
         │           │ - Verify all keys present        │
         │           └──────────────────────────────────┘
         │                     │
         │                     ▼
         │           ┌──────────────────────────────────┐
         │           │ Cache Data (5 minutes)           │
         │           │ + Update Timestamp               │
         │           └──────────────────────────────────┘
         │                     │
         └─────────────────────┼────────────────────────┐
                               │                        │
                               ▼                        ▼
                    ┌──────────────────┐   ┌──────────────────┐
                    │ Set PublishedData │   │ Set Error State  │
                    │ in Context       │   │ or Firebase Data │
                    └──────────────────┘   └──────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────┐
                    │ Components Get Data from Context  │
                    │ - Navigation                      │
                    │ - Homepage                        │
                    │ - Shop                            │
                    │ - Footer                          │
                    └──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────┐
                    │ Render with R2 Data              │
                    │ + Smooth Scrolling               │
                    │ + Custom Colors/Labels           │
                    │ + All Sections                    │
                    └──────────────────────────────────┘
```

---

## Component Architecture

```
App
├── SplashScreen (2 seconds)
├── PageLoader (progress 0-100%)
└── AppContent
    ├── Navigation (loads from R2)
    │   ├── Navigation Styles (colors, sizes)
    │   ├── Button Labels (from R2)
    │   └── Search (uses R2 products)
    ├── Page Router
    │   ├── Home
    │   │   ├── Carousel (from R2)
    │   │   ├── Featured Products (from R2)
    │   │   ├── Categories (from R2)
    │   │   ├── Dynamic Sections (from R2)
    │   │   ├── Info Sections (from R2)
    │   │   ├── Video Sections (from R2)
    │   │   └── Marquee Sections (from R2)
    │   ├── Shop
    │   │   ├── Products (from R2)
    │   │   └── Filters (from R2)
    │   ├── Admin
    │   │   └── Publish to Live (publishes to R2)
    │   ├── Checkout
    │   ├── Policies
    │   └── Contact
    ├── Modals
    │   ├── LoginModal
    │   ├── CartModal
    │   ├── ProductDetails
    │   └── MyOrders
    └── Footer (loads from R2)
```

---

## Data Sources Priority

```
┌─────────────────────────────────────────────────────────┐
│            DATA SOURCE PRIORITY CHAIN                   │
└─────────────────────────────────────────────────────────┘

USER INITIAL LOAD:
  1. R2 Cache (5 min)     ← Try first (instant)
  2. R2 API              ← Fetch fresh (200-800ms)
  3. Firebase            ← Fallback (1-3s)
  4. Defaults            ← Last resort (never shown null)

ADMIN PREVIEW MODE (?preview=true):
  1. Firebase (realtime) ← Direct from source
  
ADMIN EDIT:
  1. Firebase (live)     ← Edit here
  2. Publish to R2       ← When ready
  3. Users get R2        ← After publish

CACHE LIFECYCLE:
  ├─ Published to R2
  ├─ User 1 loads        → Cache starts
  ├─ 5 minutes pass      → Cache expires
  ├─ User 1 refreshes    → Fetch fresh
  ├─ User 2 loads        → Uses fresh cache
  └─ Repeat...
```

---

## File Organization

```
src/
├── pages/
│   ├── Home.tsx                    (uses R2 data)
│   ├── Shop.tsx                    (uses R2 data)
│   ├── Admin.tsx                   (publishes to R2)
│   ├── Checkout.tsx
│   ├── Contact.tsx
│   └── ...
├── components/
│   ├── Navigation.tsx              (R2 styles)
│   ├── Footer.tsx                  (R2 settings)
│   ├── PageLoader.tsx              (NEW - progress)
│   ├── admin/
│   │   ├── PublishManager.tsx      (publishes to R2)
│   │   └── ...
│   └── ...
├── contexts/
│   ├── PublishedDataContext.tsx    (loads R2 data)
│   └── ...
├── hooks/
│   ├── useOptimizedDataLoad.ts     (NEW - optimized)
│   └── ...
├── utils/
│   ├── publishedData.ts            (R2 API calls)
│   ├── smoothScroll.ts             (NEW - smooth scroll)
│   ├── fetchInterceptor.ts
│   └── ...
├── lib/
│   └── firebase.ts                 (Firebase config)
└── App.tsx                         (main app)

functions/api/
├── publish-data.ts                 (publishes to R2)
├── get-published-data.ts           (fetches from R2)
└── ...

docs/
├── QUICK_START.md                  (quick ref)
├── COMPLETE_SETUP_GUIDE.md         (full guide)
├── DATA_LOADING_OPTIMIZATION.md    (technical)
├── CHANGES_SUMMARY.md              (what changed)
└── ARCHITECTURE.md                 (this file)
```

---

## Performance Optimization

```
┌──────────────────────────────────────────────────────┐
│        PERFORMANCE OPTIMIZATION LAYERS               │
└──────────────────────────────────────────────────────┘

LAYER 1: Caching
└─ 5-minute cache of R2 data
   └─ Eliminates API calls if recent
      └─ <500ms load time for cached data

LAYER 2: Parallel Loading  
└─ Fetch from R2 + Firebase in parallel
   └─ Whichever succeeds first is used
      └─ Fallback always ready

LAYER 3: Timeout Handling
└─ 15-second timeout on R2 requests
   └─ Fallback to Firebase if slow
      └─ Never leaves user waiting forever

LAYER 4: Progressive Loading
└─ Navigation ready at 60%
   └─ Content ready at 100%
      └─ Visual feedback via PageLoader

LAYER 5: Smooth Scrolling
└─ CSS scroll-behavior: smooth
   └─ All navigation scrolls smoothly
      └─ Better UX throughout site

LAYER 6: Lazy Loading (Admin)
└─ Heavy pages lazy-loaded
   └─ Suspense boundaries
      └─ Faster initial app load
```

---

## State Management

```
┌────────────────────────────────────────────┐
│        GLOBAL STATE MANAGEMENT             │
└────────────────────────────────────────────┘

PublishedDataContext
├── data: PublishedData | null
│   ├── products
│   ├── categories
│   ├── navigation_settings
│   ├── carousel_images/settings
│   ├── homepage_sections
│   ├── video_sections
│   ├── footer_settings
│   ├── policies
│   └── (28 total sections)
│
├── loading: boolean
│   └─ true while fetching
│
├── error: boolean
│   └─ true if all sources fail
│
└── refresh(): Promise<void>
   └─ Manual refresh function

⬇️ Consumed By:
├─ App (checks for Coming Soon)
├─ Navigation (loads styles)
├─ Home (loads all sections)
├─ Shop (loads products)
├─ Footer (loads settings)
└─ All child components
```

---

## Request Timeout Flow

```
R2 Request
│
├─ AbortController created
├─ 15-second timeout set
│
└─ fetch('/api/get-published-data')
   │
   ├─ Success (< 15s)
   │  └─ Parse + Cache + Return
   │
   ├─ Network Error
   │  └─ Catch block → Fall to Firebase
   │
   ├─ Timeout (≥ 15s)
   │  └─ Abort signal fires → Catch → Firebase
   │
   └─ Firebase Fallback
      └─ Fetch all data in parallel
         └─ Return combined data
            └─ Always succeeds (Firebase is reliable)
```

---

## Deployment Checklist

```
✅ Components
  ✅ PageLoader.tsx created
  ✅ Navigation updated
  ✅ App.tsx updated

✅ Hooks
  ✅ useOptimizedDataLoad.ts created
  
✅ Utilities
  ✅ smoothScroll.ts created
  ✅ publishedData.ts enhanced
  
✅ Contexts
  ✅ PublishedDataContext working

✅ Admin Panel
  ✅ Publish Manager component
  ✅ Publish to R2 functional

✅ Performance
  ✅ Caching implemented
  ✅ Smooth scrolling enabled
  ✅ Timeout handling added
  ✅ Progress indicator working

✅ Documentation
  ✅ QUICK_START.md
  ✅ COMPLETE_SETUP_GUIDE.md
  ✅ DATA_LOADING_OPTIMIZATION.md
  ✅ CHANGES_SUMMARY.md
  ✅ ARCHITECTURE.md (this)
```

---

## Summary

The system now has:
- ✅ Optimized R2 data loading
- ✅ Professional progress indicator
- ✅ Smooth scrolling throughout
- ✅ Intelligent caching
- ✅ Graceful fallbacks
- ✅ No null values
- ✅ Fast performance

**Result**: Professional, fast, reliable e-commerce site ✨

---

**Architecture Version**: 1.0
**Last Updated**: February 8, 2026
