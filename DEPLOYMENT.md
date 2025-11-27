# Deployment Guide

Your AI Interview Assistant is now optimized for free hosting! Here's how to deploy:

## What Was Removed

- ❌ Electron desktop app dependencies (~500MB)
- ❌ Express server
- ❌ ESLint and dev tools
- ❌ Concurrently, wait-on, and other unused packages
- ✅ Reduced from ~600MB to ~260KB build size!

## Option 1: Deploy to Vercel (Recommended - Easiest)

### Steps:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Vite settings ✅
   - Add environment variable:
     - Key: `ANTHROPIC_API_KEY`
     - Value: Your API key
   - Click "Deploy"

3. **Done!** Your app is live at `your-app.vercel.app`

## Option 2: Deploy to Netlify

### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repo
   - Settings are auto-configured via `netlify.toml` ✅
   - Add environment variable:
     - Key: `ANTHROPIC_API_KEY`
     - Value: Your API key
   - Click "Deploy"

3. **Done!** Your app is live at `your-app.netlify.app`

## Option 3: Deploy to Render

### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Click "New" > "Static Site"
   - Connect your GitHub repository
   - Settings:
     - Build Command: `npm run build`
     - Publish Directory: `dist`
   - Add environment variable:
     - Key: `ANTHROPIC_API_KEY`
     - Value: Your API key
   - Click "Create Static Site"

3. **Done!** Your app is live at `your-app.onrender.com`

## Environment Variable Setup

For ALL platforms, you need to add:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

Get your API key from: [console.anthropic.com](https://console.anthropic.com)

## Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Create .env file
echo "ANTHROPIC_API_KEY=your_key" > .env

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure

```
meeting-assistant/
├── api/
│   └── chat.js              # Serverless function
├── src/
│   ├── App.jsx
│   ├── MeetingAssistant.jsx # Main component
│   ├── main.jsx
│   └── *.css
├── dist/                    # Build output (261KB)
├── index.html
├── package.json             # Minimal dependencies
├── vercel.json              # Vercel config
├── netlify.toml             # Netlify config
└── README.md
```

## Cost Estimate (Free Tier)

- **Vercel Free:** 100GB bandwidth/month ✅
- **Netlify Free:** 100GB bandwidth/month ✅
- **Render Free:** Unlimited static sites ✅
- **Claude API:** ~$0.001 per request (pay-as-you-go)

## Troubleshooting

### Issue: API not working
- Check environment variable is set correctly
- Variable name must be: `ANTHROPIC_API_KEY`
- Redeploy after adding variables

### Issue: Microphone not working
- Use Chrome or Edge browser
- Allow microphone permissions
- HTTPS required (free hosting provides this)

### Issue: Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. Deploy to your chosen platform
2. Share the URL with yourself for interviews
3. Test microphone and AI responses
4. Optional: Add custom domain

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs

Happy interviewing! 🎤🤖
