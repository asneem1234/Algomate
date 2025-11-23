# Vercel Deployment Guide for AlgoMate

## Prerequisites
- GitHub account with your AlgoMate repository
- Vercel account (sign up at https://vercel.com)
- Gemini API key

## Deployment Steps

### 1. Prepare Your Repository
Make sure all changes are committed and pushed to GitHub:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `asneem1234/Algomate`
4. Vercel will auto-detect the configuration from `vercel.json`

### 3. Configure Environment Variables
In the Vercel project settings, add these environment variables:

- **GEMINI_API_KEY**: `AIzaSyB9yma7tUseCBP3QbZlBUDTAkV970GssyU`
- **PORT**: `3000` (optional, defaults to 3000)

### 4. Deploy
Click "Deploy" and Vercel will:
- Install dependencies
- Build your project
- Deploy to a production URL

### 5. Access Your App
Once deployed, you'll get a URL like: `https://algomate-username.vercel.app`

## Important Notes

### Database Considerations
⚠️ **SQLite on Vercel**: Vercel's serverless environment is stateless, which means SQLite databases won't persist between requests. 

**Solutions:**
1. **Use Vercel Postgres** (Recommended)
   - Free tier available
   - Persistent storage
   - Better for production

2. **Use Vercel KV** (Redis-based)
   - Good for caching AI responses
   
3. **Use external database** (MongoDB Atlas, PlanetScale, etc.)

### API Caching
Since SQLite won't work reliably on Vercel, consider:
- Using Vercel KV for caching AI responses
- Using a proper database service
- Removing caching and relying on Gemini API directly (slower but works)

## Files Created for Vercel
- `vercel.json` - Deployment configuration
- `.vercelignore` - Files to exclude from deployment
- Updated `package.json` - Root package file with dependencies

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

### Runtime Errors
- Check environment variables are set correctly
- Review Vercel function logs in the dashboard

### Database Issues
- If you see SQLite errors, the database isn't persisting
- Switch to a managed database solution

## Alternative: Deploy Backend and Frontend Separately

If you encounter issues with the monorepo structure:

1. **Deploy Backend**: Create a separate Vercel project for `backend/`
2. **Deploy Frontend**: Create another Vercel project for `frontend/`
3. **Update API URL**: In `frontend/app.js`, update the `apiBase` to point to your backend URL

## Next Steps After Deployment
1. Test all features on the live URL
2. Set up custom domain (optional)
3. Enable automatic deployments from GitHub
4. Monitor usage and performance in Vercel dashboard
