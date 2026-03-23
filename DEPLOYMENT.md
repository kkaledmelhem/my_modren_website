# Deployment Plan — khaledmelhem.dev

> Total cost: ~$12/year (domain only). Everything else is free.

---

## Overview

| Layer | Platform | Cost |
|---|---|---|
| Frontend (React) | Vercel | Free |
| Backend (Spring Boot) | Railway | Free |
| Domain | Namecheap / Porkbun | ~$12/yr |
| SSL Certificate | Vercel (auto) | Free |

---

## Step 1 — Push Code to GitHub

Your git repo is already initialized. You just need a remote.

**1a.** Go to [github.com](https://github.com) → **New repository**
- Name: `khaled-melhem-portfolio`
- Visibility: **Public**
- Leave everything else unchecked → **Create repository**

**1b.** Open a terminal in `C:\Users\HP\Desktop\khaled melhem\` and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/khaled-melhem-portfolio.git
git branch -M main
git add .
git commit -m "Initial portfolio push"
git push -u origin main
```

> `node_modules/` and `target/` are already in `.gitignore` — safe to push.

---

## Step 2 — Deploy Frontend on Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub → **Add New Project**
2. Import `khaled-melhem-portfolio`
3. **Override** the auto-detected settings:

| Setting | Value |
|---|---|
| Root Directory | `website/frontend` |
| Framework Preset | Create React App |
| Build Command | `npm run build` |
| Output Directory | `build` |

4. Click **Deploy**

✅ Done in ~2 minutes. You get: `khaled-melhem-portfolio.vercel.app`

> Every push to `main` on GitHub triggers an automatic redeploy on Vercel.

---

## Step 3 — Deploy Backend on Railway (Free)

The backend handles `/api/contact`. Without it the contact form falls back to `mailto:` automatically — so this step is optional but recommended.

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo
3. Set these **Environment Variables** in Railway dashboard:

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8080` |

4. After deploy, copy your Railway URL (e.g. `khaled-melhem-website.up.railway.app`)

5. Go to **Vercel → your project → Settings → Environment Variables** and add:
```
REACT_APP_API_URL = https://khaled-melhem-website.up.railway.app
```

6. Update `website/frontend/package.json` — change the proxy:
```json
"proxy": "https://khaled-melhem-website.up.railway.app"
```

7. Push the change to GitHub → Vercel auto-redeploys.

---

## Step 4 — Buy the Domain

Go to [namecheap.com](https://namecheap.com) or [porkbun.com](https://porkbun.com) (cheaper).

Search: `khaledmelhem.dev` → ~$10–12/year → Buy it.

> No hosting package needed. Domain only.

---

## Step 5 — Connect Domain to Vercel

1. Vercel → your project → **Settings → Domains**
2. Type `khaledmelhem.dev` → **Add**
3. Vercel shows you two DNS records to add

4. Go to **Namecheap → Domain List → Manage → Advanced DNS** and add:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

5. Wait 5–30 minutes for DNS to propagate.

✅ Your site is live at `https://khaledmelhem.dev` with free SSL.

---

## Final Architecture

```
https://khaledmelhem.dev
        │
        ▼
    Vercel CDN
  (React build)
        │
        └── /api/* ──► Railway
                      (Spring Boot :8080)
                      Contact form handler
```

---

## After Go-Live Checklist

- [ ] Test contact form sends correctly
- [ ] Test CV download button (`/Khaled_Melhem_Resume.pdf`)
- [ ] Test dark/light mode toggle
- [ ] Test Arabic language toggle
- [ ] Test on mobile (iPhone + Android)
- [ ] Share the link on LinkedIn profile
- [ ] Add the URL to your CV
- [ ] Set up Umami analytics — create free account at [umami.is](https://umami.is), add your website ID to `public/index.html`

---

## Future upgrades (when ready)

| Upgrade | How |
|---|---|
| Custom email (khaled@khaledmelhem.dev) | Cloudflare Email Routing (free) |
| Blog CMS (edit posts without code) | Contentful or Sanity free tier |
| Contact form emails | Add JavaMailSender + Gmail SMTP to Spring Boot backend |
| Analytics dashboard | Umami self-hosted on Railway |
| German language version | Add `de` key to `translations.js` |
