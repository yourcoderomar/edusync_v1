# 🔴 Enable Supabase Realtime for Attendance Updates

Real-time updates require Realtime to be enabled in your Supabase project. Follow these steps:

## 📋 Step-by-Step Instructions

### 1. Go to Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `aqgqiipiposiuiulnjcl`

### 2. Enable Realtime for the `attendance` Table

1. Click on **Database** in the left sidebar
2. Click on **Replication** (or **Realtime** in some versions)
3. Find the `attendance` table in the list
4. Toggle the switch to **enable** Realtime for the `attendance` table
4. Make sure it shows as **Enabled** ✅

### 3. Verify Realtime is Working

1. Open your browser's Developer Console (F12)
2. Go to the attendance marking page
3. Look for this message in the console:
   - ✅ `Real-time subscription connected for attendance: [sessionId]` - **Success!**
   - ❌ `Real-time subscription error...` - Realtime is not enabled

### 4. Test Real-Time Updates

1. Open the attendance marking page in two browser windows/tabs
2. Mark attendance for a student in one window
3. The other window should **automatically update** without refreshing

## 🔍 Troubleshooting

### If you see "CHANNEL_ERROR" in console:

- **Check**: Realtime is enabled for the `attendance` table
- **Check**: Your Supabase project has Realtime enabled (some free tier projects may have limitations)
- **Check**: Your network/firewall isn't blocking WebSocket connections

### If subscription connects but no updates:

- **Check**: RLS (Row Level Security) policies allow the user to see the attendance records
- **Check**: The `session_id` filter matches correctly
- **Check**: Browser console for any error messages

### Enable Realtime via SQL (Alternative Method)

If the UI doesn't work, you can enable it via SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this command:

```sql
-- Enable Realtime for attendance table
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
```

3. Verify it's enabled:

```sql
-- Check if Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

You should see `attendance` in the list.

## 📚 Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Replication](https://supabase.com/docs/guides/realtime/postgres-changes)

