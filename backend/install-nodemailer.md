# Install Nodemailer

Run this command in the backend directory:

```bash
npm install nodemailer
```

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-admin-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-url.com
```

## Gmail Setup Instructions

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in EMAIL_PASS (not your regular password)

## Alternative Email Services

You can also use:
- Outlook: `service: 'outlook'`
- Yahoo: `service: 'yahoo'`
- Custom SMTP: Configure host, port, secure options
