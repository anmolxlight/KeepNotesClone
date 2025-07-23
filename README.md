# Keep Notes Clone - Web App

A pixel-perfect Google Keep clone built with React, TypeScript, and Tailwind CSS. Features note management, labels, search, and AI chat interface.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Features

- **📝 Note Management** - Create, edit, delete, pin, archive notes
- **🎨 Google Keep UI** - Exact color scheme and layout recreation  
- **🏷️ Labels** - Organize notes with custom labels
- **🔍 Search** - Real-time search across titles, content, labels
- **🤖 AI Chat** - Interactive assistant (demo mode)
- **📱 Responsive** - Works on desktop, tablet, mobile
- **💾 Persistence** - Auto-save to localStorage

## 🌐 Deployment

### Netlify (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy:
   - Drag & drop `dist/` folder to [Netlify](https://netlify.com)
   - Or connect Git repo for auto-deploys

### Other Platforms

The `dist/` folder works with any static hosting:
- Vercel
- GitHub Pages  
- Cloudflare Pages
- AWS S3 + CloudFront

## 🛠 Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Router
- Heroicons

## 📝 Scripts

```bash
npm run dev      # Development server
npm run build    # Production build  
npm run preview  # Preview build locally
npm run lint     # Code linting
```

## 🔧 Configuration

Optional environment variables for future AI integration:

```bash
# Copy example file
cp .env.example .env

# Add your API keys when ready
VITE_GEMINI_API_KEY=your_key_here
```

---

**Ready to deploy!** 🚀 Your Google Keep clone is production-ready. 