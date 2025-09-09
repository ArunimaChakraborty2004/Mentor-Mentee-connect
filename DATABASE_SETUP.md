# Database Setup Instructions

## Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to your project: https://wukeibhjznoqhfnifaaj.supabase.co
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Database Schema
1. Copy the contents of `database-schema-clean.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the schema

## Step 3: Verify Tables Created
After running the schema, you should see these tables in the "Table Editor":
- user_profiles
- mentee_profiles  
- mentoring_sessions
- session_feedback
- mentor_availability

## Step 4: Check Row Level Security (RLS)
The schema includes RLS policies to ensure users can only access their own data.

## Quick Test
After setting up the database:
1. Refresh the mentee management page
2. The console should show detailed logging
3. Try adding a mentee to test the functionality

## Troubleshooting
If you see errors like "relation 'mentee_profiles' does not exist":
- The database schema hasn't been run yet
- Make sure you're connected to the correct Supabase project
- Check the SQL Editor for any syntax errors when running the schema
