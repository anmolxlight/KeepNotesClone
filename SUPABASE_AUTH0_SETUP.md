# Supabase + Auth0 Setup Guide

This guide will help you set up Supabase for the database and Auth0 for authentication in your Google Keep clone app.

## 🚀 Why Supabase + Auth0?

- **Supabase**: PostgreSQL database with real-time features, auto-generated APIs, and great React Native support
- **Auth0**: Robust authentication with social logins, MFA, and excellent developer experience
- **Perfect Together**: Supabase for data, Auth0 for auth = Best of both worlds

## 📋 Prerequisites

- A Supabase account ([supabase.com](https://supabase.com))
- An Auth0 account ([auth0.com](https://auth0.com))
- React Native development environment set up

---

## 🗄️ Part 1: Supabase Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in:
   - **Name**: `keep-notes-clone`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier is fine for development

### Step 2: Get Supabase Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Create Database Tables

Go to **SQL Editor** and run this script:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  color TEXT DEFAULT 'default',
  pinned BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  image_url TEXT,
  audio_url TEXT,
  audio_transcript TEXT,
  checklist_items JSONB DEFAULT '[]',
  reminder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat threads table
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1976d2',
  UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_pinned ON notes(pinned) WHERE pinned = true;
CREATE INDEX idx_notes_archived ON notes(archived);
CREATE INDEX idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX idx_labels_user_id ON labels(user_id);

-- Full text search index for notes
CREATE INDEX idx_notes_search ON notes USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(audio_transcript, ''))
);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users FOR ALL USING (id = auth.uid()::text);
CREATE POLICY "Users can view own notes" ON notes FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view own chat threads" ON chat_threads FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view own labels" ON labels FOR ALL USING (user_id = auth.uid()::text);

-- Functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Configure Supabase Settings

1. Go to **Settings** → **API**
2. Ensure **Enable database webhooks** is ON
3. Go to **Authentication** → **Settings**
4. Disable **Enable signup** (we'll use Auth0 for auth)
5. Add your Auth0 domain to **Site URL** (we'll get this in Part 2)

---

## 🔐 Part 2: Auth0 Authentication Setup

### Step 1: Create Auth0 Application

1. Go to [manage.auth0.com](https://manage.auth0.com)
2. Click **Applications** → **Create Application**
3. Fill in:
   - **Name**: `Keep Notes Clone`
   - **Type**: **Native**
4. Click **Create**

### Step 2: Configure Auth0 Application

In your application settings:

#### Basic Information
- **Domain**: Copy this (looks like: `your-tenant.auth0.com`)
- **Client ID**: Copy this (looks like: `abcdefgh123456`)

#### Application URIs
Add these to **Allowed Callback URLs**:
```
com.keepnotesclone.auth0://your-domain.auth0.com/android/com.keepnotesclone/callback,
com.keepnotesclone.auth0://your-domain.auth0.com/ios/com.keepnotesclone/callback
```

Add these to **Allowed Logout URLs**:
```
com.keepnotesclone.auth0://your-domain.auth0.com/android/com.keepnotesclone/callback,
com.keepnotesclone.auth0://your-domain.auth0.com/ios/com.keepnotesclone/callback
```

Add this to **Allowed Web Origins**:
```
file://*
```

#### Advanced Settings
- Go to **Advanced Settings** → **Grant Types**
- Ensure these are checked:
  - ✅ Authorization Code
  - ✅ Refresh Token
  - ✅ Implicit

### Step 3: Configure Social Connections (Optional)

1. Go to **Authentication** → **Social**
2. Enable providers you want:
   - **Google**: For Google Sign-In
   - **Facebook**: For Facebook Login
   - **Apple**: For Sign in with Apple
3. Follow the setup instructions for each provider

### Step 4: Create Auth0 Actions (Optional)

For advanced user management, create an action:

1. Go to **Actions** → **Library**
2. Click **Build Custom**
3. Name: `Sync User with Supabase`
4. Trigger: **Login / Post Login**
5. Add this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const supabaseUrl = event.secrets.SUPABASE_URL;
  const supabaseKey = event.secrets.SUPABASE_SERVICE_KEY;
  
  const user = {
    id: event.user.user_id,
    email: event.user.email,
    name: event.user.name || event.user.nickname,
    avatar_url: event.user.picture
  };
  
  try {
    // This would sync user data with Supabase
    // You'd implement this based on your needs
    console.log('User logged in:', user.email);
  } catch (error) {
    console.error('Failed to sync user:', error);
  }
};
```

---

## ⚙️ Part 3: App Configuration

### Step 1: Update Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here

# Other services (optional)
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### Step 2: Configure Android

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        // Add this line with your Auth0 domain
        manifestPlaceholders = [
            auth0Domain: "your-tenant.auth0.com", 
            auth0Scheme: "${applicationId}.auth0"
        ]
    }
}
```

**Note**: Replace `your-tenant.auth0.com` with your actual Auth0 domain.

The AndroidManifest.xml should already include the Auth0 callback intent filter:

```xml
<!-- Auth0 callback intent filter -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="${auth0Scheme}" android:host="${auth0Domain}" />
</intent-filter>
```

### Step 3: Configure iOS

Edit `ios/KeepNotesClone/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>None</string>
        <key>CFBundleURLName</key>
        <string>auth0</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>$(PRODUCT_BUNDLE_IDENTIFIER).auth0</string>
        </array>
    </dict>
</array>
```

### Step 4: Run iOS Pod Install

```bash
cd ios && pod install
```

---

## 🧪 Part 4: Testing the Setup

### Step 1: Test Supabase Connection

1. Run your app
2. Check the logs for: `✅ Supabase initialized successfully`
3. If you see errors, verify your URL and API key

### Step 2: Test Auth0 Authentication

1. Tap the login button in your app
2. You should be redirected to Auth0's login page
3. After login, you should be redirected back to your app
4. Check logs for: `✅ Auth0 login successful`

### Step 3: Test Data Flow

1. Create a note in your app
2. Check the Supabase dashboard → **Table Editor** → **notes**
3. You should see your note appear in the database

---

## 🔧 Troubleshooting

### Common Supabase Issues

**Error: "relation 'notes' does not exist"**
- Run the SQL schema script again
- Check that you're connected to the right project

**Error: "Invalid API key"**
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Make sure there are no extra spaces

**Error: "Row Level Security policy violation"**
- User isn't authenticated properly
- Check your RLS policies

### Common Auth0 Issues

**Error: "Invalid callback URL"**
- Check your callback URLs in Auth0 dashboard
- Verify your app's bundle identifier matches

**Error: "Invalid domain"**
- Make sure `AUTH0_DOMAIN` doesn't include `https://`
- Should be: `your-tenant.auth0.com` not `https://your-tenant.auth0.com`

**Login redirects but doesn't return to app**
- Check your URL scheme configuration
- Verify iOS Info.plist and Android manifestPlaceholders

---

## 🚀 Next Steps

1. **Real-time Features**: Enable Supabase real-time subscriptions
2. **File Storage**: Set up Supabase Storage for images/audio
3. **Push Notifications**: Add push notifications via Auth0/Supabase
4. **Analytics**: Add analytics to track user behavior
5. **Deploy**: Deploy to App Store and Google Play

---

## 📚 Additional Resources

- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [Auth0 React Native Quickstart](https://auth0.com/docs/quickstart/native/react-native)
- [Expo + Auth0 Guide](https://auth0.com/blog/expo-react-native-authentication/)

---

## 💡 Pro Tips

1. **Development**: Use Supabase local development for faster iteration
2. **Security**: Always use RLS (Row Level Security) in production
3. **Performance**: Add database indexes for frequently queried columns
4. **Monitoring**: Set up Supabase and Auth0 monitoring/alerts
5. **Backup**: Enable database backups in Supabase

Your Google Keep clone now has enterprise-grade authentication and database! 🎉