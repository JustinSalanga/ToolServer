# Quick Start Guide

## ⚠️ IMPORTANT: How to Access the App

**DO NOT** try to access source files directly like:
- ❌ `http://localhost:3003/src/pages/GPT.jsx`
- ❌ `http://localhost:3003/src/App.jsx`

**DO** access the application through the root URL and routes:
- ✅ `http://localhost:3003` (root - will redirect to login)
- ✅ `http://localhost:3003/login`
- ✅ `http://localhost:3003/gpt`
- ✅ `http://localhost:3003/users`
- ✅ `http://localhost:3003/jobs`
- ✅ `http://localhost:3003/configs`

## Steps to Run

1. **Make sure you're in the frontend directory:**
```bash
cd frontend
```

2. **Install dependencies (first time only):**
```bash
npm install
```

3. **Start the dev server:**
```bash
npm run dev
```

4. **Open your browser and go to:**
```
http://localhost:3003
```

5. **You should see the login page!**

## Troubleshooting

### If you see a blank page:
1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Check the Network tab to see if files are loading

### If you see "ERR_BLOCKED_BY_CLIENT":
- This happens when trying to access source files directly
- **Solution**: Use the root URL `http://localhost:3003` instead

### If the page doesn't load:
1. Make sure the dev server is running (check terminal)
2. Check that port 3003 is not blocked by firewall
3. Try clearing browser cache (Ctrl+Shift+Delete)
