# 🚀 Quick Start - 3 Steps to Deploy

## Step 1: Get Your API Key (2 minutes)

1. Go to https://console.anthropic.com
2. Create account / Sign in
3. Generate API key
4. Copy it!

## Step 2: Push to GitHub (2 minutes)

```bash
cd meeting-assistant
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Deploy (1 minute)

### Option A: Vercel (Easiest)
1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variable:
   - `ANTHROPIC_API_KEY` = your key
5. Click "Deploy"
6. Done! 🎉

### Option B: Netlify
1. Go to https://netlify.com
2. Click "Add new site"
3. Select your GitHub repo
4. Add environment variable:
   - `ANTHROPIC_API_KEY` = your key
5. Click "Deploy"
6. Done! 🎉

## That's It!

Your app is now live at:
- Vercel: `your-app.vercel.app`
- Netlify: `your-app.netlify.app`

## Local Testing First?

```bash
# Install
npm install

# Create .env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run
npm run dev

# Open http://localhost:5173
```

## Troubleshooting

**Build fails?**
```bash
rm -rf node_modules
npm install
npm run build
```

**API not working?**
- Check environment variable is set
- Redeploy after adding variable

**Microphone not working?**
- Use Chrome or Edge
- Allow microphone permissions
- Must be HTTPS (free hosting has this)

## Need More Help?

See detailed guides:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Step-by-step deployment
- `CHANGES.md` - What changed

---

**Ready to deploy? Pick a platform above and go!** 🚀
