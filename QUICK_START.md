# Quick Start Guide

## 🚀 Local Development

### Backend
```bash
cd backend
npm install
npm run dev          # Runs with .env.local
# OR
npm run dev:watch    # Runs with .env.local and auto-restart
```

Server will start at: `http://localhost:3000`

### Frontend
```bash
cd frontend
npm install
npm run dev          # Automatically uses .env.local
```

App will start at: `http://localhost:5000`

---

## 📦 Environment Files

### Already Created ✅

**Backend:**
- `.env.local` - Local development (MongoDB localhost)
- `.env.production` - Production values (MongoDB Atlas)

**Frontend:**
- `.env.local` - Local development (API: localhost:3000)
- `.env.production` - Production (API: Render backend URL)

### No Setup Needed!
Just run `npm run dev` and everything works!

---

## 🌐 Production Deployment

### Backend (Render Web Service)

**Environment Variables to Set:**
```
MONGODB_URI=mongodb+srv://vikasvs:vikasvs%40123@swansales12.9qkhwjv.mongodb.net/salesdb?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-secret>
PORT=10000
NODE_ENV=production
```

**Generate JWT Secret:**
```bash
openssl rand -base64 64
```

### Frontend (Render Static Site)

**Environment Variables to Set:**
```
VITE_API_URL=https://swansalespersonappbackend.onrender.com
```

---

## ✅ Verification

### Check Backend:
```bash
curl http://localhost:3000/
# Should return: {"message": "Sales Tracker API is running"}
```

### Check Frontend:
1. Open: `http://localhost:5000`
2. Open browser console (F12)
3. Type: `console.log(import.meta.env.VITE_API_URL)`
4. Should show: `http://localhost:3000`

### Test Login:
1. Go to login page
2. Enter credentials
3. Should successfully login and redirect

---

## 📝 Available Commands

### Backend
```bash
npm start          # Production mode (uses default .env)
npm run dev        # Development mode with .env.local
npm run dev:watch  # Development with auto-restart
npm run prod       # Test production mode locally
```

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build (uses .env.production)
npm run preview    # Preview production build
```

---

## 🐛 Common Issues

### "Cannot connect to server"
- Check backend is running: `http://localhost:3000`
- Check `VITE_API_URL` in browser console

### "MongoDB connection error"
- Ensure MongoDB is running locally
- Or use MongoDB Atlas connection string

### Environment variables not working
- Restart dev server after changing .env files
- Check file names are correct (.env.local not .env.local.txt)
- Frontend vars must start with `VITE_`

---

## 📚 More Info

See `ENV_SETUP_GUIDE.md` for detailed documentation.
