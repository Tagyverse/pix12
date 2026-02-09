# Add Navigation Settings to Firebase Rules

## Quick Copy-Paste Solution

This is the exact `navigation_settings` block to add to your Firebase Realtime Database rules.

### Step 1: Go to Firebase Console
1. Open Firebase Console → Your Project
2. Go to **Realtime Database**
3. Click the **Rules** tab
4. You'll see your current rules in JSON format

### Step 2: Find the Right Location
Look for this in your rules:

```json
"site_settings": {
  ...existing code...
},

"favorites": {
```

### Step 3: Copy This Exact Block

Add this **between** `site_settings` and `favorites`:

```json
"navigation_settings": {
  ".read": true,
  ".write": "auth != null",
  ".validate": "newData.hasChild('background')",
  "background": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/))"
  },
  "text": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/))"
  },
  "activeTab": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/))"
  },
  "inactiveButton": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/))"
  },
  "borderRadius": {
    ".validate": "!newData.exists() || (newData.isString() && (newData.val() === 'full' || newData.val() === 'lg' || newData.val() === 'md' || newData.val() === 'sm'))"
  },
  "buttonSize": {
    ".validate": "!newData.exists() || (newData.isString() && (newData.val() === 'sm' || newData.val() === 'md' || newData.val() === 'lg'))"
  },
  "themeMode": {
    ".validate": "!newData.exists() || (newData.isString() && (newData.val() === 'default' || newData.val() === 'dark' || newData.val() === 'light'))"
  },
  "buttonLabels": {
    ".validate": "!newData.exists() || newData.hasChildren()",
    "home": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "shop": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "search": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "cart": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "myOrders": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "login": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "signOut": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "admin": {
      ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0 && newData.val().length <= 50)"
    },
    "$other": {
      ".validate": false
    }
  },
  "updated_at": {
    ".validate": "!newData.exists() || newData.isString()"
  },
  "$other": {
    ".validate": false
  }
},
```

### Step 4: Publish
1. Click **Publish** button
2. Wait for "Rules published successfully" message
3. Done!

## What This Does

- ✓ Allows admins to save navigation settings (colors, button labels, sizes)
- ✓ Validates hex color codes (#FFF, #FFFFFF, #FFFFFFFF)
- ✓ Validates button sizes (sm, md, lg)
- ✓ Validates border radius (full, lg, md, sm)
- ✓ Validates theme modes (default, dark, light)
- ✓ Validates button labels (max 50 characters each)
- ✓ Only allows authenticated users to write

## Testing

After publishing rules:

1. Go to Admin Panel → Navigation
2. Change a color or label
3. Click Save
4. Should see: "Navigation settings saved successfully!"
5. Refresh page - settings should persist
6. Go to Admin → Publish to Live
7. Homepage should show the new navigation colors/labels

## Troubleshooting

**Error: "Permission denied"**
- Rules weren't published correctly
- Check you're logged in as admin
- Try again - wait 30 seconds between attempts

**Settings save but don't appear in admin**
- Rules published but browser cached old rules
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Then refresh admin page

**Settings still show default colors**
- First publish: Admin → Navigation → Save → Publish to Live
- Wait 10 seconds for R2 cache to update
- Refresh homepage
