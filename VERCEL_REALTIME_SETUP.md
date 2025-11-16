# 🔴 Fix Real-Time Updates on Vercel

Real-time updates work through WebSockets from your browser to Supabase - **no Vercel configuration needed**. However, you need to make sure your environment variables are set correctly in Vercel.

## 🔍 Step 1: Check Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `edusync-v11-duay06i45-yourcoderomars-projects`
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Make sure these variables are set:

### Required Variables:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- ✅ `NEXT_PUBLIC_SITE_URL` - Your Vercel URL (optional, but recommended)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations (optional)

### Example Values:
```
NEXT_PUBLIC_SUPABASE_URL=https://aqgqiipiposiuiulnjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://edusync-v11-duay06i45-yourcoderomars-projects.vercel.app
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 Step 2: Redeploy After Adding Variables

**Important:** After adding or updating environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

Environment variables are only available to new deployments!

## 🧪 Step 3: Test Real-Time in Production

1. Open your Vercel deployment URL
2. Open browser Developer Tools (F12)
3. Go to the **Console** tab
4. Navigate to the attendance marking page
5. Look for these messages:
   - ✅ `Real-time subscription connected for attendance: [sessionId]` - **Working!**
   - ❌ `Real-time subscription error...` - Check Supabase Realtime settings
   - ⏱️ `Real-time subscription timed out` - Network/firewall issue

## 🔍 Step 4: Verify Supabase Realtime is Enabled

Even though it works locally, double-check:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Database** → **Replication** (or **Realtime**)
4. Make sure `attendance` table has Realtime **enabled** ✅

## 🐛 Troubleshooting

### Real-time works locally but not on Vercel:

**Check 1: Environment Variables**
- ✅ Are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel?
- ✅ Did you redeploy after adding them?

**Check 2: Browser Console**
- Open Developer Tools on your Vercel site
- Check for WebSocket connection errors
- Look for the subscription status messages

**Check 3: Network Issues**
- Some corporate networks block WebSocket connections
- Try from a different network (mobile hotspot, etc.)
- Check if your Supabase project allows connections from your domain

**Check 4: Supabase Realtime Status**
- Go to Supabase Dashboard → Database → Replication
- Verify `attendance` table is enabled
- Check if there are any errors in Supabase logs

### Quick Test:

1. Open your Vercel site in browser
2. Open Developer Console (F12)
3. Run this in the console:
```javascript
// Check if Supabase URL is correct
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

If it shows `undefined`, the environment variable isn't set in Vercel!

## 📝 Quick Checklist

- [ ] Environment variables set in Vercel
- [ ] Redeployed after adding variables
- [ ] Realtime enabled for `attendance` table in Supabase
- [ ] Checked browser console for connection status
- [ ] Tested from different network (if corporate firewall)

## 🔗 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)

