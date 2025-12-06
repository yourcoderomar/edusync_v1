# 🚀 Production Setup Guide

This guide ensures your application works correctly in production (Vercel).

## 📋 Required Environment Variables

Make sure these environment variables are set in your Vercel project:

### 1. Supabase Configuration (Required)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)

### 2. n8n Webhook Configuration (Required for Send Messages)
- ✅ `N8N_WEBHOOK_URL` - Your n8n webhook URL for sending messages

### 3. App Configuration (Optional but Recommended)
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_SITE_URL` - Your production URL
- `NEXT_PUBLIC_APP_DESCRIPTION` - Application description

## 🔧 Setting Up Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `edusync-v11`
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add each variable:
   - **Key**: `N8N_WEBHOOK_URL`
   - **Value**: Your n8n webhook URL (e.g., `https://your-n8n-instance.com/webhook/abc123`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

## ⚠️ Important: Redeploy After Adding Variables

**Environment variables are only available to NEW deployments!**

After adding or updating environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## 🧪 Testing in Production

### Test Send Messages Endpoint

1. Open your production URL: `https://edusync-v11.vercel.app`
2. Navigate to a session page
3. Try to send messages
4. Check Vercel logs if there are errors:
   - Go to **Deployments** → Click on latest deployment → **Functions** tab
   - Look for `[send-messages]` log entries

### Common Issues

#### ❌ Error: "N8N webhook URL is not configured"
**Solution**: Make sure `N8N_WEBHOOK_URL` is set in Vercel environment variables and you've redeployed.

#### ❌ Error: "Request timeout"
**Solution**: Your webhook is taking too long to respond. Check your n8n workflow performance.

#### ❌ Error: "Failed to verify permissions"
**Solution**: Check Supabase connection and ensure user is authenticated.

## 📊 Monitoring

Check Vercel Function Logs:
1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Find `api/sessions/[sessionId]/send-messages`
4. View real-time logs

## 🔍 Debug Information

The API route includes debug IDs in all responses. If you encounter errors:
1. Note the `debugId` from the error response
2. Check Vercel logs for entries with that `debugId`
3. Look for detailed error messages with context

## ✅ Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Redeployed after adding environment variables
- [ ] Tested authentication flow
- [ ] Tested send messages functionality
- [ ] Checked Vercel logs for any errors
- [ ] Verified Supabase connection works
- [ ] Verified n8n webhook is accessible from Vercel



