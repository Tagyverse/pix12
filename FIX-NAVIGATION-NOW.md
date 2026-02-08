# Fix Navigation Issues - Step by Step

## What's Wrong?
Navigation changes in admin aren't showing on the home page.

## Why?
Navigation data either:
1. Not saving to Firebase
2. Not publishing to R2
3. Not loading on frontend

## How to Fix

### STEP 1: Clear Browser Cache
```
Windows: Ctrl + Shift + Delete
Mac: Cmd + Shift + Delete
```
Select "All time" and clear.

### STEP 2: Save Navigation Settings
1. Go to **Admin Panel**
2. Scroll to **Navigation Customizer** section
3. Change button label: "Shop All" → "BROWSE"
4. Click **Save Navigation Settings** button
5. Wait for confirmation alert

### STEP 3: Open Console
Press **F12** and click **Console** tab

### STEP 4: Publish Data
1. Scroll up to **Publish Data** section
2. Click blue **"Validate Data"** button
3. Check console for: `✓ navigation_settings: YES`
4. Click **"Publish"** button
5. Confirm dialog
6. Wait for success message

### STEP 5: Check Console Logs
Look for these logs (in order):
```
[ADMIN] Data collected: ... sections ...
[ADMIN] ✓ navigation_settings: YES
[ADMIN] Publish successful!
```

### STEP 6: Go to Home Page
1. Click **Home** button in navigation
2. Open Console (F12)
3. Look for: `[NAVIGATION] Loaded navigation settings from R2`
4. Check if button says "BROWSE" instead of "Shop All"

## Did It Work?
- ✓ YES: Button text changed to "BROWSE" → **Fixed!**
- ✗ NO: Still shows "Shop All" → Continue below

## Troubleshooting

### If Console Shows: `✓ navigation_settings: NO`
**Problem**: Navigation not saved in Firebase
**Fix**:
1. Go back to Admin → Navigation Customizer
2. Make sure you clicked "Save Navigation Settings"
3. Try again and watch for alert

### If Console Shows: `[NAVIGATION] Using default content`
**Problem**: Navigation not in R2
**Fix**:
1. Make sure you published (step 4)
2. Wait 10 seconds after publish
3. Refresh page
4. If still shows: Publish again

### If Publish Fails
**Problem**: R2 not configured or API error
**Fix**:
1. Check R2 bucket is added to Cloudflare Pages
2. Check Pages function is deployed
3. Try publish again

## Quick Test

**In Admin Console** (F12 while on admin):
```javascript
// This will show all navigation data
localStorage.getItem('admin_navigation_settings')
```

**On Home Console** (F12 while on home):
```javascript
// This will show what frontend is loading
fetch('/api/get-published-data').then(r => r.json()).then(d => console.log(d.navigation_settings))
```

## Still Not Working?

1. **Firebase**: Check `navigation_settings` exists
2. **Publish**: Check publish success message says "verified"
3. **R2**: Download `site-data.json` from R2, verify it has navigation_settings
4. **Frontend**: Try incognito window (new cache)

## Remember
- Always **Save** in Navigation Customizer
- Always **Publish** after saving
- Always **Clear Cache** before testing
- Always **Check Console Logs** for [NAVIGATION]

---

**Try this workflow:**
1. Change label in Admin
2. Click Save (wait for alert)
3. Click Publish (wait for alert)
4. Clear cache (Ctrl+Shift+Delete)
5. Go to Home
6. Refresh (F5)
7. Check Console for [NAVIGATION] logs
8. Check if button text changed
