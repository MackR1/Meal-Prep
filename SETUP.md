# Meal Prep App — Setup & Deploy Guide

## What you're building
A shared meal prep app hosted at a real URL. You and Hilary both open the same link — same recipes, same weekly plan, same shopping list, live updates.

---

## Step 1 — Set up Firebase (10 min)

Firebase is Google's free database. You need this so data syncs between you and Hilary.

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `meal-prep` → click through the setup
3. Once inside, click **"Firestore Database"** in the left sidebar
4. Click **"Create database"** → choose **"Start in test mode"** → pick a location (us-east1 is fine) → Done
5. Now click the **gear icon** (top left) → **"Project settings"**
6. Scroll down to **"Your apps"** → click the **</>** (web) icon
7. Name it `meal-prep-web` → click **"Register app"**
8. You'll see a `firebaseConfig` block — **copy all 6 values** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

---

## Step 2 — Add the code to GitHub (5 min)

The project files are ready to push. In your terminal:

```bash
# Clone your existing repo
git clone https://github.com/MackR1/Weekly-Meal-Prep.git
cd Weekly-Meal-Prep

# Copy the new project files in (replace everything)
# Then:
git add .
git commit -m "Rebuild with Firebase shared sync"
git push origin main
```

---

## Step 3 — Deploy to Vercel (5 min)

1. Go to **https://vercel.com** → sign in with GitHub
2. Click **"Add New Project"** → find **Weekly-Meal-Prep** → click **"Import"**
3. Vercel auto-detects Vite — just click **"Deploy"**
4. It'll fail the first time because Firebase keys aren't set yet — that's fine, do the next step

---

## Step 4 — Add Firebase keys to Vercel (3 min)

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add each of these (name → value from Step 1):

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | your apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | your authDomain |
| `VITE_FIREBASE_PROJECT_ID` | your projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | your storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your messagingSenderId |
| `VITE_FIREBASE_APP_ID` | your appId |

3. Go to **Deployments** → click the three dots on the latest → **"Redeploy"**
4. It builds and gives you a URL like `https://weekly-meal-prep.vercel.app`

---

## Step 5 — Share with Hilary

Send her the Vercel URL. That's it. You're both on the same live app.

Any recipe you add, any meal you plan, any shopping item you check off — she sees it instantly, and vice versa.

---

## Local development (optional)

If you want to run it on your laptop:

```bash
cd Weekly-Meal-Prep
npm install

# Create a .env file with your Firebase keys:
cp .env.example .env
# Edit .env and fill in your values

npm run dev
# Opens at http://localhost:5173
```

---

## Free tier limits (Firebase + Vercel)

Both are free for personal use at this scale:
- **Firebase Firestore**: 50,000 reads/day, 20,000 writes/day — you'd need thousands of users to hit this
- **Vercel**: Unlimited deploys, 100GB bandwidth/month

You will never pay for this.
