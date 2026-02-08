# Navigation & Data Sync Diagnostic Guide

## Problem: Navigation Not Updating in R2

This guide will help you diagnose and fix the navigation issue step by step.

---

## Step 1: Verify Navigation Data in Firebase

**Action**: Check if navigation settings exist in Firebase

1. Open Admin Panel → Navigation Customizer
2. Make a SMALL change (e.g., change one button label)
3. Click "Save Navigation Settings"
4. Open Browser Console (F12)
5. Look for logs: `[NAV] Saving navigation settings to navigation_settings:`

**Expected**: Should see the save confirmation with your changes

**If you see error**: 
- Check Firebase permissions
- Ensure you're logged in as admin
- Check that database rules allow writes

---

## Step 2: Verify Data Reaches Publish API

**Action**: Check the publish process logs

1. In Admin Panel, scroll to "Publish Data" section
2. Click blue "Validate Data" button
3. In Console, look for: `[ADMIN] Data collected:`
4. Check if it shows: `✓ site_content: YES`, `✓ social_links: YES`, `✓ navigation_settings: YES`

**Expected Output**:
```
[ADMIN] Data collected: 28 sections with X products and Y categories
[ADMIN] Sections with data: [banner_social, card_designs, carousel_images, categories, footer_config, ...]
[ADMIN] ✓ site_content: YES
[ADMIN] ✓ social_links: YES
[ADMIN] ✓ marquee_sections: YES
[ADMIN] ✓ navigation_settings: YES
```

**If navigation_settings shows NO**:
- It means the data wasn't saved in Firebase
- Go back to Step 1 and save again

---

## Step 3: Verify Data Publishes to R2

**Action**: Check the publish response

1. Click "Publish" button (with confirmation)
2. In Console, look for: `[PUBLISH] Starting publish to R2`
3. Check for: `[PUBLISH] Successfully uploaded to R2`
4. Look for: `[PUBLISH] data keys: [...]`

**Expected**: Should show all 28+ data keys including `navigation_settings`

**If you see error**:
- Check R2 bucket is configured
- Check Cloudflare Pages function is deployed
- Check CORS headers are correct

---

## Step 4: Verify R2 Contains Navigation Data

**Action**: Check what's actually in R2 storage

1. After publish, check Console for: `[R2] Available data keys:`
2. Should list: `navigation_settings` (and 27+ others)
3. Look for: `[R2] site_content: true`, `[R2] social_links: true`

**Expected**: All data types show as available

**If missing**:
- R2 publish failed
- Check R2 bucket permissions
- Check Cloudflare Pages R2 binding

---

## Step 5: Verify Frontend Loads from R2

**Action**: Check navigation loads on home page

1. Go to Home page
2. Open Console
3. Look for: `[NAVIGATION] Navigation settings from R2:`
4. Should show the style object with your colors/labels

**Expected**:
```
[NAVIGATION] Navigation settings from R2: {
  background: "#...",
  text: "#...",
  activeTab: "#...",
  buttonLabels: { home: "...", shop: "...", ... }
}
```

**If you see**:
- `[NAVIGATION] No navigation_settings in published data` → Go to Step 3
- `[NAVIGATION] Using default content` → Navigation settings not in R2

---

## Complete Testing Workflow

Follow this checklist to verify the entire system:

```
Step 1: Save Navigation in Admin
└─ Check: [NAV] Saving navigation settings to navigation_settings

Step 2: Validate Data in Admin
└─ Check: [ADMIN] ✓ navigation_settings: YES

Step 3: Publish to R2
└─ Check: [PUBLISH] Successfully uploaded to R2
└─ Check: [PUBLISH] data keys includes navigation_settings

Step 4: Check R2 Response
└─ Check: [R2] Available data keys includes navigation_settings

Step 5: Check Frontend Loading
└─ Check: [NAVIGATION] Navigation settings from R2 shows your data
└─ Check: Navigation buttons reflect your custom labels/colors
```

---

## Quick Fixes

### Navigation Not Saving
```
1. Admin → Navigation Customizer
2. Make sure all colors are selected (not default)
3. Make sure button labels are entered
4. Click "Save Navigation Settings"
5. Wait for alert confirmation
```

### Navigation Not Publishing
```
1. Admin → Publish Data
2. Click blue "Validate Data" button
3. Verify: ✓ navigation_settings: YES
4. Click "Publish"
5. Wait for success message
```

### Navigation Not Loading on Frontend
```
1. Open Home page
2. Press F12 to open Console
3. Look for [R2] or [NAVIGATION] logs
4. If [R2] shows no data: 
   - Publish again from admin
   - Clear browser cache (Ctrl+Shift+Del)
5. If [NAVIGATION] shows defaults:
   - Refresh page
   - Check network tab for get-published-data API
```

---

## Console Log Key

| Log Prefix | Meaning | Where |
|-----------|---------|-------|
| `[NAV]` | Navigation Customizer saving | Admin Panel |
| `[ADMIN]` | Admin publish process | Admin Panel Console |
| `[PUBLISH]` | R2 publish API | Cloudflare Worker logs |
| `[R2]` | R2 data fetch | Frontend Console |
| `[NAVIGATION]` | Navigation component loading | Home page Console |

---

## If Still Not Working

1. **Check Firebase Rules**:
   - Make sure `navigation_settings` path has write permissions
   - Check firestore/database rules

2. **Check Publish API**:
   - Verify `functions/api/publish-data.ts` has navigation_settings in logs
   - Check Cloudflare Pages deployment

3. **Check R2**:
   - Download `site-data.json` from R2 bucket
   - Verify it contains `navigation_settings` field
   - Check file size (should be several KB)

4. **Check Frontend**:
   - Clear browser cache completely
   - Open in incognito window
   - Check network tab for API calls

---

## Example: Setting Custom Navigation

1. Go to Admin → Navigation Customizer
2. Change button label: "Shop All" → "Browse Products"
3. Change color: Active Tab → #FF6B6B (red)
4. Click "Save Navigation Settings"
5. Admin → Publish Data → Click "Publish"
6. Refresh Home page
7. Check Console for `[NAVIGATION] Loaded navigation settings from R2`
8. See updated button text and colors

---

## Still Having Issues?

Check these in order:
1. Firebase: Does `navigation_settings` exist with your data?
2. Admin: Does publish show `✓ navigation_settings: YES`?
3. R2: Does `site-data.json` contain navigation_settings?
4. Frontend: Does Console show `[NAVIGATION]` logs?
5. Cache: Is browser cache cleared?

If none work, the issue is likely:
- Firebase permissions
- Cloudflare Pages function not deployed
- R2 bucket not configured
- Browser cache not cleared
