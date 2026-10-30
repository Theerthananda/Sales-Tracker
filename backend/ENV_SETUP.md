# Environment Variables Setup Guide

## Development Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env`:
   - **MONGODB_URI**: Use local MongoDB or Atlas development cluster
   - **JWT_SECRET**: Generate with `openssl rand -base64 32`
   - **PORT**: 5000 (default)
   - **NODE_ENV**: development

## Production Environment (Render)

### Required Environment Variables in Render Dashboard:

Go to your Render service → Environment tab and add:

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/salestracker?retryWrites=true&w=majority` |
| `JWT_SECRET` | Strong random string | Generate with `openssl rand -base64 64` |
| `NODE_ENV` | production | `production` |
| `PORT` | Auto-set by Render | `10000` (don't manually set) |

### Steps to Configure on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service
3. Click on **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"**
5. Add each variable from the table above
6. Click **"Save Changes"** - Render will auto-redeploy

### MongoDB Atlas Setup:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a production cluster (if not exists)
3. Database Access → Add Database User
4. Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0) for Render
5. Database → Connect → Connect your application → Copy connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `salestracker` (or your preferred name)

### Security Notes:

- Never commit `.env` files to Git
- Use strong, unique JWT secrets for production
- Regularly rotate production secrets
- Use different MongoDB clusters for dev/prod
