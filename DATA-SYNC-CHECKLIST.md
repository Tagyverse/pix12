# Complete Firebase to R2 Data Sync Checklist

## Overview
This document provides a complete checklist to verify all data is being correctly synced from Firebase to R2 and reflected on the homepage and other pages.

---

## Part 1: Admin Panel - Before Publishing

### Data Validation
- [ ] Click "Validate Data" button in Admin panel
- [ ] Check console for: `[ADMIN] Validation complete:`
- [ ] Verify validation panel shows "All checks passed"
- [ ] Ensure no errors in the validation report

### What Gets Published
When you click "Publish" in Admin, the following data is collected from Firebase:

**Core Data:**
- ✓ Products (`products/`)
- ✓ Categories (`categories/`)
- ✓ Reviews (`reviews/`)
- ✓ Offers (`offers/`)

**Site Configuration:**
- ✓ Site Settings (`site_settings/`)
- ✓ Carousel Images & Settings (`carousel_images/`, `carousel_settings/`)
- ✓ Navigation Settings (`navigation_settings/`)
- ✓ Tax Settings (`tax_settings/`)

**Homepage Sections:**
- ✓ Homepage Sections (`homepage_sections/`)
- ✓ Info Sections (`info_sections/`)
- ✓ Marquee Sections (`marquee_sections/`) ← **Banner/Marquee text**
- ✓ Video Sections (`video_sections/`)
- ✓ Video Section Settings (`video_section_settings/`)
- ✓ Video Overlay Sections (`video_overlay_sections/`)
- ✓ Video Overlay Items (`video_overlay_items/`)
- ✓ Default Sections Visibility (`default_sections_visibility/`) ← **Controls which sections show**

**Design & Cards:**
- ✓ Card Designs (`card_designs/`)

**Banners & Social:**
- ✓ Social Links (`social_links/`) ← **Instagram, Facebook, etc links**
- ✓ Site Content (`site_content/`) ← **Welcome banner, top banner text**

**Other Settings:**
- ✓ Coupons (`coupons/`)
- ✓ Try On Models (`try_on_models/`)
- ✓ Footer Settings (`footer_settings/`)
- ✓ Footer Config (`footer_config/`)
- ✓ Policies (`policies/`)
- ✓ Settings (`settings/`)
- ✓ Bill Settings (`bill_settings/`)

---

## Part 2: Console Logging - After Publishing

### Watch for these log messages to confirm publish succeeded:

**In Admin panel:**
```
[ADMIN] Starting publish process...
[ADMIN] Fetching Firebase data...
[ADMIN] Fetched products: data exists
[ADMIN] Fetched categories: data exists
[ADMIN] Fetched marquee_sections: data exists
[ADMIN] Fetched site_content: data exists
[ADMIN] Fetched social_links: data exists
[ADMIN] Data collected: 28 sections with X products and Y categories
[ADMIN] Sending to R2...
[PUBLISH] Starting publish to R2
[PUBLISH] File: site-data.json
[PUBLISH] Successfully uploaded to R2 in XXXms
[PUBLISH] Verified published data in XXXms
```

### Then on Home Page:
```
[HOME] Starting data fetch...
[R2] Fetching published data from R2...
[R2] Successfully fetched and parsed data in XXXms
[R2] Available data keys: [all your data keys]
[R2] site_content: true
[R2] social_links: true
[R2] marquee_sections: true
[R2] Data cached successfully
[HOME] Published data loaded successfully
[HOME] Loaded X products
[HOME] Data loading complete
```

### Then components should show:
```
[TOP-BANNER] Using published data: {...banner content...}
[WELCOME-BANNER] Using published social links: {...social links...}
```

---

## Part 3: Homepage Verification Checklist

### Marquee/Top Banner Section
- [ ] Open home page console (F12)
- [ ] Look for `[TOP-BANNER]` logs
- [ ] If it says "Using default content", then site_content is not in R2
- [ ] If it says "Using published data", then it's working correctly
- [ ] Visual check: Top banner text matches what you set in BannerSocialManager

### Welcome Banner (Title & Social Links)
- [ ] Check console for `[WELCOME-BANNER]` logs
- [ ] If it says "No published social links, using defaults", social_links not synced
- [ ] If it says "Using published social links", data is synced
- [ ] Visual check: Social icons and links match what you configured

### Other Homepage Sections
- [ ] Carousel displays correctly
- [ ] Feature boxes show
- [ ] Categories display
- [ ] Products load
- [ ] Marquee sections (text scrolling) display with correct colors/text

---

## Part 4: Data Flow Diagram

```
Firebase (Admin edits here)
    ↓
    ├── Admin.tsx collects all data from Firebase refs
    ├── Validates data with validateFirebaseData()
    ├── Sends to /api/publish-data
    │
    ↓
R2 Storage (site-data.json)
    ├── Stored in Cloudflare R2
    ├── Verified after upload
    │
    ↓
Home Page (Users see this)
    ├── getPublishedData() fetches from /api/get-published-data
    ├── Falls back to Firebase if R2 fails
    ├── Components read from cache:
    │   ├── TopBanner reads site_content.top_banner
    │   ├── WelcomeBanner reads site_content.welcome_banner & social_links
    │   ├── Home page reads marquee_sections, carousel, etc
    │
    ↓
Shop Page (Also uses R2 data)
    ├── Categories from R2
    ├── Products from R2
```

---

## Part 5: Debugging Steps

### If Marquee Not Updating:
1. Check Admin console: `[ADMIN] Fetched marquee_sections: data exists`
2. Check Home console: `[R2] marquee_sections: true`
3. Check `[TOP-BANNER]` log to see if using published or default
4. Verify in Firebase that data exists at `marquee_sections/`

### If Social Links Not Updating:
1. Check Admin console: `[ADMIN] Fetched social_links: data exists`
2. Check Home console: `[R2] social_links: true`
3. Check `[WELCOME-BANNER]` log for "Using published social links"
4. Verify in Firebase that data exists at `social_links/`

### If Banner Text Not Updating:
1. Check Admin console: `[ADMIN] Fetched site_content: data exists`
2. Check Home console: `[R2] site_content: true`
3. Check TopBanner & WelcomeBanner logs
4. Verify in Firebase that data exists at `site_content/`

### If Still Using Defaults:
1. Check Network tab - is `/api/get-published-data` returning 404?
2. Check if R2 bucket is properly configured
3. Look for `[R2] No published data found (404)` - means nothing published yet
4. Look for `[FALLBACK] Loading from Firebase` - system switched to fallback

---

## Part 6: Key Files to Monitor

**Admin Panel Publishing:**
- `/src/pages/Admin.tsx` - Lines ~954-1000 (data collection)

**R2 API Endpoints:**
- `/functions/api/publish-data.ts` - Upload to R2
- `/functions/api/get-published-data.ts` - Fetch from R2

**Frontend Data Loading:**
- `/src/utils/publishedData.ts` - Main data loading logic
- `/src/components/TopBanner.tsx` - Marquee banner
- `/src/components/WelcomeBanner.tsx` - Welcome section with social links
- `/src/pages/Home.tsx` - Main homepage using published data

**Contexts:**
- `/src/contexts/PublishedDataContext.tsx` - Provides data to all components

---

## Part 7: Quick Actions

### To Force Refresh Data on Client:
1. Press F12 to open DevTools
2. In console, type: `window.location.reload(true)` - Hard refresh
3. Check fresh logs for data loading

### To Clear R2 Cache:
After publishing, clients automatically get fresh data within 5 minutes. To force immediate refresh:
1. Press F12
2. In console: `localStorage.clear()`
3. Reload page

### To Verify R2 Has Data:
1. Go to Cloudflare Dashboard
2. Navigate to R2 Storage
3. Open your bucket
4. Look for `site-data.json` file
5. Click to preview - should contain all your data

---

## Expected Console Output Summary

After you publish from Admin and refresh home page, you should see:

```
✓ [ADMIN] Fetching Firebase data...
✓ [ADMIN] Fetched products: data exists
✓ [ADMIN] Fetched marquee_sections: data exists
✓ [ADMIN] Fetched site_content: data exists
✓ [ADMIN] Fetched social_links: data exists
✓ [PUBLISH] Successfully uploaded to R2 in XXXms

✓ [R2] Fetching published data from R2...
✓ [R2] Successfully fetched and parsed data in XXXms
✓ [R2] site_content: true
✓ [R2] social_links: true
✓ [R2] marquee_sections: true
✓ [R2] Data cached successfully

✓ [HOME] Published data loaded successfully
✓ [HOME] Loaded X products
✓ [TOP-BANNER] Using published data: {...}
✓ [WELCOME-BANNER] Using published social links: {...}
```

If any line says `false` or is missing, that data needs attention!

