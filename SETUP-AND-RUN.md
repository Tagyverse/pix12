# Complete Setup & Running Guide

## Prerequisites

Ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Firebase project set up
- Cloudflare Workers (for R2 functions)
- Git (optional, for version control)

## Step 1: Install Dependencies

```bash
# Navigate to project
cd pix12

# Install all packages
npm install

# Or with yarn
yarn install
```

## Step 2: Configure Environment Variables

Create `.env.local` file in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Stripe for payments
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

## Step 3: Set Up Firebase Realtime Database

### 3.1 Create Firebase Project
1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Create a project"
3. Enter project name (e.g., "Pixie Blooms")
4. Enable Analytics (optional)
5. Click "Create"

### 3.2 Enable Realtime Database
1. Go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to users)
4. Start in **Test Mode** (for development)
5. Click "Enable"

### 3.3 Set Up Firebase Authentication
1. Go to "Build" → "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Enable"

### 3.4 Get Firebase Config
1. Go to "Project Settings"
2. Copy Web app credentials
3. Paste into `.env.local`

## Step 4: Set Up R2 & Cloudflare Workers

### 4.1 Create R2 Bucket
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to "R2" in sidebar
3. Click "Create bucket"
4. Name it: `pixie-blooms-data`
5. Choose region (US, EU, or APAC)
6. Click "Create"

### 4.2 Deploy Worker Functions
```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Deploy functions
wrangler deploy

# Or deploy just R2 functions
wrangler deploy --name=publish-data
wrangler deploy --name=get-published-data
```

### 4.3 Configure R2 Bindings
In `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "pixie-blooms-data"
```

## Step 5: Start Development Server

```bash
# Start Vite dev server
npm run dev

# Output will show:
# Local: http://localhost:5173
# Admin: http://localhost:5173/admin
```

## Step 6: Build for Production

```bash
# Build the application
npm run build

# Output created in dist/ folder

# Test production build locally
npm run preview
```

## Step 7: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables when prompted
# Follow prompts to connect to your Vercel project
```

Or deploy manually:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub/GitLab repository
4. Add environment variables
5. Click "Deploy"

## Step 8: Deploy to Cloudflare Pages

```bash
# Install Wrangler
npm install -g wrangler

# Deploy with Wrangler
wrangler pages deploy dist/

# Or use Wrangler Dashboard:
# 1. Go to Pages in Cloudflare Dashboard
# 2. Create new project
# 3. Connect to GitHub
# 4. Select repository
# 5. Set build settings:
#    - Build command: npm run build
#    - Build output directory: dist
# 6. Deploy
```

## Running the Application

### Development Mode

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2 (optional): Watch mode
npm run watch
```

Then open: http://localhost:5173

### Admin Panel
**URL**: http://localhost:5173/admin

**Default Credentials** (set in Firebase):
- Email: admin@example.com
- Password: (set in Firebase Authentication)

### Access Different Pages
- **Home**: http://localhost:5173/
- **Shop**: http://localhost:5173/shop
- **Admin**: http://localhost:5173/admin
- **Checkout**: http://localhost:5173/checkout

## First Time Setup Workflow

### 1. Create Admin Account
1. Go to Admin: http://localhost:5173/admin
2. Click "Sign Up"
3. Create account with email/password
4. Make this account an admin (in Firebase console)

### 2. Add Initial Data

#### Add Products
1. Admin → Products section
2. Click "Add Product"
3. Fill in:
   - Product name
   - Price
   - Description
   - Category
   - Upload image
4. Click "Save"

#### Add Categories
1. Admin → Categories section
2. Click "Add Category"
3. Enter category name
4. Click "Save"

#### Customize Navigation
1. Admin → Settings → Navigation Customizer
2. Update button labels (Home, Shop, etc.)
3. Change colors if desired
4. Click "Save Navigation Settings"

#### Set Up Banners
1. Admin → Settings → Banner & Social Manager
2. Edit welcome banner
3. Add social media links
4. Click "Save"

### 3. Validate & Publish
1. Click "Validate Data"
2. Verify all sections pass validation
3. Click "Publish"
4. Wait for success confirmation
5. Data now live on frontend!

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run seed         # Seed initial data (if available)

# Deployment
npm run deploy       # Deploy to Vercel
vercel deploy        # Manual Vercel deploy
wrangler deploy      # Deploy workers
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti :5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173     # Windows

# Or use different port
npm run dev -- --port 3000
```

### Firebase Connection Issues
- [ ] Check `.env.local` has correct credentials
- [ ] Verify Firebase project is created
- [ ] Check Realtime Database is enabled
- [ ] Verify Authentication is enabled
- [ ] Check Firebase rules allow public read/write (test mode)

### R2 Not Working
- [ ] Verify Cloudflare R2 bucket created
- [ ] Check `wrangler.toml` has correct binding
- [ ] Deploy workers: `wrangler deploy`
- [ ] Check R2 bucket permissions

### Frontend Not Loading Data
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify publish was successful
- [ ] Check R2 bucket has `site-data.json`
- [ ] Check Firebase fallback working

### Admin Panel Not Accessible
- [ ] Verify Firebase Auth enabled
- [ ] Check user is created in Firebase
- [ ] Check user email/password correct
- [ ] Check console for auth errors

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Preview production | `npm run preview` |
| Deploy workers | `wrangler deploy` |
| Deploy to Vercel | `vercel deploy` |
| Install packages | `npm install` |
| Update packages | `npm update` |

## Environment Variables Reference

```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=<value>
VITE_FIREBASE_AUTH_DOMAIN=<domain>
VITE_FIREBASE_DATABASE_URL=<url>
VITE_FIREBASE_PROJECT_ID=<id>
VITE_FIREBASE_STORAGE_BUCKET=<bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<id>

# Stripe (Optional - for payments)
VITE_STRIPE_PUBLIC_KEY=<key>

# Vercel (Optional - for deployment)
VERCEL_PROJECT_ID=<id>
VERCEL_ORG_ID=<id>
```

## Next Steps

1. ✓ Follow this guide to set up
2. ✓ Read `FINAL-VERIFICATION.md` to verify everything works
3. ✓ Read `NAVIGATION-FIX-GUIDE.md` for navigation customization
4. ✓ Start adding your products and content
5. ✓ Customize branding and settings
6. ✓ Deploy to production

## Support

If you encounter issues:
1. Check console logs (F12 → Console)
2. Read the troubleshooting section
3. Check `.env.local` is configured correctly
4. Verify Firebase project is set up
5. Check R2 bucket is accessible

---

**Status**: Ready to deploy and use! 🚀
