# Housing Worlds — Lead CRM & Telecalling Platform

A real estate CRM built for **Housing Worlds** sales operations, telecalling logs, daily follow-ups, and live team pipeline tracking. Connected directly with **Google Firebase Cloud Firestore**.

## 🚀 Live App Access

- **Current Shared URL**: [Housing Worlds CRM Live](https://ais-pre-p4fnlil5au4j7pl4myfkjs-930682205579.asia-southeast1.run.app)
- **Database**: Google Cloud Firestore (`ai-studio-housingworldslea-8ab9fb40-c4c4-4411-a651-8376403819dd`)

---

## 📦 Deployment Options

### Option 1: Vercel (1-Click)
1. Push / Import this repository into [Vercel](https://vercel.com).
2. Vercel automatically detects the configuration via `vercel.json`:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy**.
4. In Settings > Domains, you can add your custom domain: `crm.housingworlds.com`.

### Option 2: Netlify Deployment

#### Method A: Git Integration (Recommended)
1. Push this repository to **GitHub / GitLab**.
2. Log in to [Netlify](https://app.netlify.com) and click **"Add new site" > "Import an existing project"**.
3. Select your repository. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **"Deploy site"**.
5. Your CRM will be live at a URL like `https://housing-worlds-crm.netlify.app`.
6. To attach a custom domain, go to **Domain management** > **Add a domain** (e.g. `crm.housingworlds.com`).

#### Method B: Manual / Drag & Drop
1. Run `npm run build` locally.
2. Go to [Netlify Drop](https://app.netlify.com/drop).
3. Drag and drop the generated `dist` folder directly onto Netlify.

> **Note**: SPA client-side routing is pre-configured via `public/_redirects` and `netlify.toml` so page refreshes and direct links will never 404. All Firestore credentials are embedded within `firebase-applet-config.json` and work right out of the box.

### Option 3: Local Development
```bash
npm install
npm run dev
```
Runs at `http://localhost:3000`.
