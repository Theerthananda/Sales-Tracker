# 📧 Email Configuration for Render Production

## 🚨 Issue: Emails work locally but not on Render

This guide will help you configure email functionality for production on Render.

## 📋 Step-by-Step Setup

### 1. Generate Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to **Google Account Settings** → **Security**
3. Under "Signing in to Google", click **2-Step Verification**
4. Scroll down and click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Swansorter Sales Tracker" as the name
7. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 2. Configure Environment Variables on Render

1. **Login to Render Dashboard**
2. **Navigate to your backend service**
3. **Click on "Environment" tab**
4. **Add these environment variables:**

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Important Notes:**
- Use your **actual Gmail address** for `EMAIL_USER`
- Use the **16-character app password** (no spaces) for `EMAIL_PASS`
- Replace `your-frontend-url` with your actual frontend URL

### 3. Verify Configuration

After setting environment variables:

1. **Redeploy your backend service** on Render
2. **Check the logs** for these messages:
   ```
   📧 Creating email transporter for: your-email@gmail.com
   🌍 Environment: production
   📧 Email transport configuration: {...}
   ```

### 4. Test Email Functionality

1. **Create an assignment** from admin dashboard
2. **Check Render logs** for:
   ```
   📧 Attempting to send assignment email to: salesperson@example.com
   Assignment email sent: <message-id>
   ```

## 🔍 Troubleshooting

### If emails still don't work:

1. **Check Render logs** for error messages
2. **Verify Gmail App Password** is correct (16 characters, no spaces)
3. **Ensure 2-Factor Authentication** is enabled on Gmail
4. **Check spam folder** of recipient email

### Common Error Messages:

- `Email credentials not configured` → Environment variables not set
- `Invalid login` → Wrong app password or 2FA not enabled
- `Authentication failed` → Regular password used instead of app password

## 🧪 Manual Test

You can test email configuration by running:

```bash
# In your backend directory
node utils/testEmail.js
```

Update the test email addresses in the file before running.

## ✅ Success Indicators

When properly configured, you should see:

1. **In Render logs:**
   ```
   📧 Creating email transporter for: your-email@gmail.com
   📧 Attempting to send assignment email to: recipient@example.com
   Assignment email sent: <message-id>
   ```

2. **Email received** by the intended recipient

## 🔐 Security Notes

- **Never commit** `.env` files to Git
- **Use App Passwords** only (not regular Gmail password)
- **Rotate App Passwords** periodically for security

---

**Need help?** Check the Render logs first, then verify your Gmail App Password setup.
