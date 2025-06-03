# Google Keep Clone with AI Features

A fully functional Google Keep Notes clone built with React Native and Expo, featuring advanced AI capabilities powered by Google Gemini, vector search with Pinecone, speech-to-text with Deepgram, and cloud synchronization with MongoDB.

## 🌟 Features

### Core Google Keep Features
- **Pixel-perfect UI**: Exact replica of Google Keep's dark theme interface
- **Note Management**: Create, edit, delete, pin, and organize notes
- **Color Coding**: 12 Google Keep color options for note categorization
- **Search**: Real-time search across note titles, content, and labels
- **Grid/List Views**: Multiple viewing modes for note organization
- **Labels**: Custom label creation and filtering
- **Responsive Design**: Optimized for mobile devices

### AI-Powered Features
- **AI Text Generation**: Generate note content using Google Gemini AI
- **Smart Search**: Semantic search using Pinecone vector database
- **AI Chat Assistant**: Conversational AI for note queries and management
- **Speech-to-Text**: Audio note transcription with Deepgram
- **Auto-Labeling**: AI-suggested labels for note organization
- **Note Summarization**: AI-generated summaries of long notes

### Cloud & Sync Features
- **Real-time Sync**: Automatic synchronization across devices
- **Cloud Storage**: MongoDB Atlas for reliable data persistence
- **Vector Search**: Pinecone for semantic note discovery
- **Authentication**: User management with Clerk (ready for implementation)
- **Offline Support**: Local storage with automatic cloud sync when online

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Drawer + Stack)
- **UI Framework**: Custom components with Material Design principles
- **Local Storage**: AsyncStorage for offline functionality
- **Cloud Database**: MongoDB Atlas
- **Vector Database**: Pinecone for semantic search
- **AI Services**: Google Gemini via Vercel AI SDK
- **Speech-to-Text**: Deepgram
- **Authentication**: Clerk (ready for integration)
- **TypeScript**: Full type safety throughout

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development) or Android Studio (for Android)
- Active internet connection for cloud services

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd KeepNotesClone
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=keep-notes-index
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Authentication (Optional)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Database (Optional)
MONGODB_URI=your_mongodb_connection_string_here
MONGODB_DB_NAME=keepnotesclone

# App Configuration
APP_ENV=development
```

### 3. Run the App

```bash
# Start the development server
npx expo start

# Run on specific platform
npx expo start --ios     # iOS Simulator
npx expo start --android # Android Emulator
npx expo start --web     # Web browser
```

## 🔧 Service Configuration

### Google Gemini AI Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Add the key to your `.env` file as `GEMINI_API_KEY`

**Features enabled:**
- AI text generation in notes
- Conversational AI chat assistant
- Note summarization
- Auto-label suggestions

### Pinecone Vector Database Setup

1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create a new index with:
   - **Dimension**: 384
   - **Metric**: Cosine similarity
   - **Cloud**: AWS (recommended)
   - **Region**: us-east-1
3. Get your API key and environment details
4. Update `.env` with your Pinecone credentials

**Features enabled:**
- Semantic search across notes
- AI-powered note discovery
- Related note suggestions

### Deepgram Speech-to-Text Setup

1. Sign up at [Deepgram](https://deepgram.com/)
2. Create a new API key in your dashboard
3. Add the key to your `.env` file as `DEEPGRAM_API_KEY`

**Features enabled:**
- Audio note recording and transcription
- Voice-to-text note creation
- Real-time speech recognition

### Database & Backend Setup (Optional)**Option 1: Custom Backend API**If you have your own backend API for data storage:1. Set up your REST API with endpoints for notes, chat threads, labels, and users2. Add your API base URL to `.env` as `BACKEND_URL`**Option 2: MongoDB Atlas (Legacy)**For direct MongoDB connection (requires custom backend):1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)2. Create a new cluster (free tier available)3. Create a database user and get connection string4. Whitelist your IP address5. Add connection string to `.env` as `MONGODB_URI`**Features enabled:**- Cloud note synchronization- Cross-device data persistence- Chat thread storage- User data backup**Note**: The app now uses HTTP-based database services instead of direct MongoDB connections for React Native compatibility. All database operations gracefully fall back to local storage when offline.

### Clerk Authentication Setup (Optional)

1. Sign up at [Clerk](https://clerk.com/)
2. Create a new application
3. Get your publishable key from the dashboard
4. Add to `.env` as `CLERK_PUBLISHABLE_KEY`

**Features enabled:**
- User authentication
- Multi-user support
- Social login options
- Secure user sessions

## 🎯 Usage

### Creating Notes
1. Tap the blue "+" floating action button
2. Enter title and content
3. Use the AI sparkle button to generate content with AI
4. Select colors from the bottom palette
5. Notes auto-save when you navigate away

### AI Features
1. **AI Text Generation**: Tap the sparkle icon in note editor, enter a prompt
2. **AI Chat**: Tap the smaller sparkle FAB on home screen
3. **Search**: Use the search bar for both keyword and semantic search
4. **Voice Notes**: Long-press the + button to record audio (Deepgram required)

### Organization
1. **Pin Notes**: Tap the pin icon in note editor or long-press note cards
2. **Colors**: Use the color palette in note editor
3. **Labels**: Add labels using the # symbol in note content
4. **Search**: Find notes by title, content, or labels

## 🔄 Sync Behavior

The app works in three modes:

1. **Offline Mode**: All features work with local storage only
2. **Partial Cloud**: Some services configured (AI works, sync may be limited)
3. **Full Cloud**: All services configured (complete functionality)

Data flows:
- **Local First**: All changes save locally immediately
- **Background Sync**: Cloud sync happens in background when online
- **Conflict Resolution**: Last-modified wins for sync conflicts

## 📱 Supported Platforms

- ✅ **iOS** (iOS 13+)
- ✅ **Android** (API 21+)
- ✅ **Web** (modern browsers)

## 🛡 Privacy & Security

- **Local Storage**: Notes stored securely on device
- **API Keys**: Never stored in app code, only in environment variables
- **Data Transmission**: All cloud communication uses HTTPS/WSS
- **User Control**: Full offline functionality without cloud services

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
```bash
# Clear Expo cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**AI features not working:**
- Verify API keys in `.env` file
- Check internet connection
- Ensure API services are active and have available quota

**Notes not syncing:**
- Check MongoDB connection string
- Verify network connectivity
- Check console logs for sync errors

**Search not working properly:**
- Ensure Pinecone index is created with correct dimensions
- Check API key and environment settings
- Allow time for notes to be indexed

### Getting Help

1. Check the console logs in Expo Dev Tools
2. Verify all environment variables are set correctly
3. Test individual services using the test functions in service files
4. Check service provider dashboards for API usage and errors

## 🚧 Development

### Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/         # Navigation configuration
├── screens/           # Main app screens
├── services/          # Cloud service integrations
├── styles/           # Theme and styling
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities
```

### Key Services

- **syncService**: Orchestrates all cloud synchronization
- **geminiService**: Handles AI text generation and chat
- **pineconeService**: Manages vector search and indexing
- **deepgramService**: Processes speech-to-text
- **databaseService**: Manages MongoDB operations
- **authService**: Handles user authentication

### Adding New Features

1. Create TypeScript types in `src/types/`
2. Implement UI components in `src/components/`
3. Add service integration in `src/services/`
4. Update sync logic in `syncService`
5. Test with all service configurations

## 📄 License

This project is for educational and demonstration purposes. Google Keep is a trademark of Google LLC.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Note**: This app demonstrates the integration of multiple AI and cloud services. While it can run without any external services using local storage, the full feature set requires API keys for the various services mentioned above. 