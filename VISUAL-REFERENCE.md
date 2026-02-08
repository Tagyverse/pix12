# Visual Reference Guide

## Homepage Section Map

```
┌─────────────────────────────────────────────┐
│         ↓ TopBanner Component ↓             │
│  🔄 "🎉 Special Offer - Get 20% OFF!" 🔄   │  ← Published from site_content.top_banner
├─────────────────────────────────────────────┤
│                                             │
│        ↓ WelcomeBanner Component ↓          │
│                                             │
│    Welcome to Pixie Blooms!                │  ← Published from site_content.welcome_banner
│    Discover our exclusive collection       │
│                                             │
│    🔗 📘 🐦 ✉️ 📱                          │  ← Published from social_links
│    (Instagram, Facebook, Twitter, etc)     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        ↓ Carousel Section ↓                 │
│   [Image Carousel with Navigation]          │  ← carousel_images, carousel_settings
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        ↓ Featured Products ↓                │
│   [Product Cards Grid]                      │  ← products, categories
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        ↓ Custom Marquee Sections ↓          │
│  🔄 "Free Shipping - Fast Delivery!" 🔄    │  ← Published from marquee_sections
│                                             │
│  🔄 "Limited Time Sale - Shop Now!" 🔄     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        ↓ Other Sections ↓                   │
│   [Videos, Info Sections, Reviews, etc]    │  ← All published to R2
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        ↓ Footer ↓                           │
│   [Footer Content & Links]                  │  ← footer_settings, footer_config
│                                             │
└─────────────────────────────────────────────┘

All data in R2 as site-data.json

Colors/Styling: ✓ Published
Text Content: ✓ Published  
Links: ✓ Published
Visibility: ✓ Published
```

---

## Data Publishing Diagram

```
ADMIN PANEL (You edit here)
│
├─ BannerSocialManager
│  ├─ Edit: Welcome banner title
│  ├─ Edit: Welcome banner subtitle
│  ├─ Edit: Social links (Instagram, Facebook, etc.)
│  └─ Edit: Toggle visibility
│
├─ MarqueeManager
│  ├─ Edit: Marquee text
│  ├─ Edit: Speed (slow/normal/fast)
│  ├─ Edit: Colors (background, text)
│  └─ Edit: Toggle visibility
│
├─ ProductManager
│  ├─ Edit: Product details
│  ├─ Edit: Prices
│  └─ Edit: Images
│
└─ Other Managers (25+ more)

         ↓ CLICK "PUBLISH" BUTTON ↓

PUBLISH PROCESS
│
├─ Step 1: Validate
│  ├─ Check: All products exist
│  ├─ Check: All categories exist
│  ├─ Check: Required fields present
│  └─ Result: ✓ Validation passed
│
├─ Step 2: Collect from Firebase
│  ├─ Get: site_content (banners)
│  ├─ Get: social_links (icons)
│  ├─ Get: marquee_sections (text)
│  ├─ Get: products (all products)
│  ├─ Get: categories (all categories)
│  └─ Get: 22 other categories
│
├─ Step 3: Upload to R2
│  ├─ Create: site-data.json
│  ├─ Size: ~500KB - 2MB
│  ├─ Upload: to Cloudflare R2
│  └─ Time: 1-2 seconds
│
├─ Step 4: Verify
│  ├─ Read: From R2
│  ├─ Validate: JSON structure
│  ├─ Check: All data intact
│  └─ Result: ✓ Verification passed
│
└─ Step 5: Notify Admin
   ├─ Success Message: "Data published!"
   ├─ Show: Product count
   ├─ Show: Category count
   ├─ Show: File size
   └─ Show: Upload time

         ↓ SUCCESS ↓

R2 STORAGE (Cloudflare)
│
└─ site-data.json
   ├─ products: {...}
   ├─ categories: {...}
   ├─ site_content: {...}           ← BANNER DATA
   │  ├─ welcome_banner: {...}
   │  └─ top_banner: {...}
   ├─ social_links: {...}           ← SOCIAL LINKS
   ├─ marquee_sections: {...}       ← MARQUEE DATA
   └─ ... (24 more categories)

         ↓ USERS VISIT HOMEPAGE ↓

FRONTEND LOADING
│
├─ Step 1: Request Data
│  ├─ Call: /api/get-published-data
│  └─ Source: Cloudflare Worker
│
├─ Step 2: Retrieve from R2
│  ├─ Read: site-data.json
│  ├─ Parse: JSON
│  ├─ Validate: Structure
│  └─ Time: 200-500ms
│
├─ Step 3: Cache Locally
│  ├─ Store: In browser cache
│  ├─ Duration: 5 minutes
│  └─ Speed: Next requests <1ms
│
└─ Step 4: Components Access
   ├─ TopBanner: Gets site_content.top_banner
   ├─ WelcomeBanner: Gets site_content.welcome_banner
   │                Gets social_links
   ├─ MarqueeSection: Gets marquee_sections
   ├─ HomePage: Gets products, categories
   └─ AllComponents: Get their respective data

         ↓ USER SEES ↓

HOMEPAGE DISPLAY
│
├─ Top Marquee: ✓ Published text with published colors
├─ Welcome Banner: ✓ Published title & subtitle
├─ Social Icons: ✓ Published links to Instagram, Facebook, etc.
├─ Custom Marquees: ✓ Published text, colors, speeds
├─ Products: ✓ Published product data
├─ Categories: ✓ Published category data
└─ Everything: ✓ From R2 with Firebase fallback

         ↓ ALL CHANGES LIVE! ↓
```

---

## Console Log Flow

```
ADMIN PUBLISHING LOGS:
════════════════════════════════════════════════════════════

[ADMIN] Starting publish process...
[ADMIN] Fetching Firebase data...
[ADMIN] Fetched products: data exists ✓
[ADMIN] Fetched categories: data exists ✓
[ADMIN] Fetched site_content: data exists ✓        ← BANNER DATA
[ADMIN] Fetched social_links: data exists ✓        ← SOCIAL DATA
[ADMIN] Fetched marquee_sections: data exists ✓    ← MARQUEE DATA
(... 21 more data sources ...)
[ADMIN] Data collected: 27 sections with X products and Y categories
[ADMIN] Sections with data: [...all 27 categories...]
[ADMIN] ✓ site_content: YES
[ADMIN] ✓ social_links: YES
[ADMIN] ✓ marquee_sections: YES
[ADMIN] Sending to R2...

[PUBLISH] Starting publish to R2
[PUBLISH] File: site-data.json
[PUBLISH] Size: XXX bytes
[PUBLISH] Data keys: [27 categories]
[PUBLISH] Products count: X
[PUBLISH] Categories count: Y
[PUBLISH] Successfully uploaded to R2 in XXXms
[PUBLISH] Verified published data in XXXms
[PUBLISH] Upload successful!


HOMEPAGE LOADING LOGS:
════════════════════════════════════════════════════════════

[HOME] Starting data fetch...
[R2] Fetching published data from R2...
[R2] Successfully fetched and parsed data in XXXms
[R2] Available data keys: [all 27 keys]
[R2] site_content: true ✓                 ← BANNER DATA AVAILABLE
[R2] social_links: true ✓                 ← SOCIAL DATA AVAILABLE
[R2] marquee_sections: true ✓             ← MARQUEE DATA AVAILABLE
[R2] Data cached successfully
[HOME] Published data loaded successfully
[HOME] Loaded X products
[HOME] Data loading complete

[TOP-BANNER] Using published data        ← USING R2 DATA
[WELCOME-BANNER] Using published banner data
[WELCOME-BANNER] Using published social links

✓ ALL COMPONENTS LOADED SUCCESSFULLY


IF R2 FAILS:
════════════════════════════════════════════════════════════

[R2] Fetching published data from R2...
[R2] No published data found (404)
[FALLBACK] Loading from Firebase...
[FALLBACK] Fetched site_content: YES     ← FALLBACK WORKS
[FALLBACK] Fetched social_links: YES
[FALLBACK] Successfully loaded from Firebase
[HOME] Published data loaded successfully
[TOP-BANNER] Using published data       ← SHOWS FALLBACK DATA
[WELCOME-BANNER] Using published social links

✓ EVERYTHING STILL WORKS VIA FIREBASE
```

---

## Component Data Source Map

```
┌──────────────────────────────────────────────────────────┐
│                    HOMEPAGE COMPONENTS                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TopBanner                                               │
│  ├─ Source: publishedData.site_content.top_banner       │
│  ├─ Location in R2: site-data.json.site_content         │
│  ├─ Fallback: Firebase at site_content/top_banner/      │
│  └─ Display: Scrolling text at top of page              │
│                                                          │
│  WelcomeBanner                                           │
│  ├─ Source: publishedData.site_content.welcome_banner   │
│  ├─ Source: publishedData.social_links                  │
│  ├─ Location in R2: site-data.json.site_content         │
│  ├─ Location in R2: site-data.json.social_links         │
│  ├─ Fallback: Firebase at site_content/welcome_banner/  │
│  ├─ Fallback: Firebase at social_links/                 │
│  └─ Display: Title, subtitle, social icons              │
│                                                          │
│  MarqueeSection(s)                                       │
│  ├─ Source: publishedData.marquee_sections              │
│  ├─ Location in R2: site-data.json.marquee_sections     │
│  ├─ Fallback: Firebase at marquee_sections/             │
│  └─ Display: Custom scrolling sections                  │
│                                                          │
│  Carousel                                                │
│  ├─ Source: publishedData.carousel_images               │
│  ├─ Source: publishedData.carousel_settings             │
│  ├─ Location in R2: site-data.json.carousel_*           │
│  └─ Display: Image carousel with controls               │
│                                                          │
│  Homepage Sections                                       │
│  ├─ Source: publishedData.homepage_sections             │
│  ├─ Location in R2: site-data.json.homepage_sections    │
│  └─ Display: Feature boxes, product grids, etc.         │
│                                                          │
│  ... (20+ more components)                               │
│                                                          │
└──────────────────────────────────────────────────────────┘

All components use:
  ├─ usePublishedData() hook
  ├─ Access publishedData object
  ├─ Read from cached R2 data
  └─ Fallback to Firebase if needed
```

---

## Firebase to R2 Data Journey

```
EDIT IN ADMIN
  ↓
BannerSocialManager (UI Component)
  ├─ Edit banner title ─────────→ Firebase (site_content/welcome_banner/)
  ├─ Edit social links ────────→ Firebase (social_links/)
  └─ Saved!
  
  ↓
  
PUBLISH FROM ADMIN
  ├─ Collect site_content from Firebase ────→ ✓ Collected
  ├─ Collect social_links from Firebase ────→ ✓ Collected
  └─ (+ 25 other data sources)
  
  ↓
  
VALIDATE DATA
  ├─ Check products exist ────→ ✓ Valid
  ├─ Check categories exist ──→ ✓ Valid
  └─ All checks pass ─────────→ ✓ Ready to publish
  
  ↓
  
UPLOAD TO R2
  ├─ Create JSON with all data ────────→ site-data.json
  ├─ Include site_content ─────────────→ ✓ Included
  ├─ Include social_links ─────────────→ ✓ Included
  ├─ Include marquee_sections ────────→ ✓ Included
  └─ Upload to Cloudflare R2 ─────────→ ✓ Uploaded
  
  ↓
  
VERIFY UPLOAD
  ├─ Read from R2 ──────────→ ✓ Data there
  ├─ Validate JSON ──────────→ ✓ Valid
  └─ Confirm all data ───────→ ✓ Complete
  
  ↓
  
USERS VISIT HOMEPAGE
  ├─ Request from R2 ────────→ /api/get-published-data
  ├─ Fetch site-data.json ──→ ✓ Retrieved
  ├─ Parse JSON ──────────────→ ✓ Parsed
  └─ Cache for 5 minutes ────→ ✓ Cached
  
  ↓
  
COMPONENTS DISPLAY
  ├─ TopBanner reads site_content.top_banner ──→ ✓ Displays
  ├─ WelcomeBanner reads site_content ────────→ ✓ Displays
  ├─ WelcomeBanner reads social_links ───────→ ✓ Displays
  ├─ MarqueeSection reads marquee_sections ──→ ✓ Displays
  └─ All components use published data ──────→ ✓ Working
  
  ↓
  
USER SEES ALL CHANGES LIVE! 🎉
```

---

## Checklist: Is It Working?

```
PUBLISH CHECKLIST:
══════════════════════════════════════════════════════════

□ Admin → Validate Data ✓
  ├─ Validation passes
  └─ No errors shown

□ Admin → Click Publish ✓
  ├─ See success notification
  ├─ Shows product count
  └─ Shows category count

□ Console Check (After Publish) ✓
  ├─ [ADMIN] ✓ site_content: YES
  ├─ [ADMIN] ✓ social_links: YES
  ├─ [ADMIN] ✓ marquee_sections: YES
  ├─ [PUBLISH] Successfully uploaded
  └─ [PUBLISH] Verified


HOMEPAGE CHECK:
══════════════════════════════════════════════════════════

□ Hard Refresh (Ctrl+F5) ✓

□ Console Logs (F12) ✓
  ├─ [R2] Successfully fetched data
  ├─ [R2] site_content: true
  ├─ [R2] social_links: true
  ├─ [TOP-BANNER] Using published data
  └─ [WELCOME-BANNER] Using published...

□ Visual Display ✓
  ├─ Top banner shows your text
  ├─ Welcome banner shows title/subtitle
  ├─ Social icons appear with links
  ├─ Marquee sections display
  ├─ Products display
  └─ Categories display

□ No Errors ✓
  ├─ No red errors in console
  ├─ No network errors
  └─ Everything loaded


IF ALL CHECKED ✓ = DATA IS SYNCED CORRECTLY!
```

---

## Quick Decision Tree

```
Edit something in admin
  │
  ├─ banner text/title?
  │  └─ Go to BannerSocialManager
  │     └─ Then Publish
  │
  ├─ social links?
  │  └─ Go to BannerSocialManager
  │     └─ Then Publish
  │
  ├─ marquee text?
  │  └─ Go to MarqueeManager
  │     └─ Then Publish
  │
  ├─ products?
  │  └─ Go to ProductManager
  │     └─ Then Publish
  │
  ├─ something else?
  │  └─ Find the right manager
  │     └─ Then Publish
  │
  └─ PUBLISH
     ├─ Validate Data first ✓
     ├─ Click Publish button
     ├─ Wait for success
     └─ Homepage automatically updates!
```

This visual reference makes it easy to understand where everything comes from and how it flows!

