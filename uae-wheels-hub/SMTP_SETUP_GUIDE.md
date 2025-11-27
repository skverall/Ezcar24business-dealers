# 📧 SMTP Configuration Guide for EZCAR24

## Overview
This guide will help you configure Zoho Mail SMTP for Supabase Auth to enable password reset emails and other authentication emails.

## 🔧 Prerequisites

1. **Zoho Mail Account** with custom domain (ezcar24.com)
2. **Supabase Access Token** with admin permissions
3. **Two-Factor Authentication** enabled in Zoho Mail

## 📋 Step-by-Step Setup

### 1. Generate Zoho App Password

1. Log in to your Zoho Mail account
2. Go to **Settings** → **Security** → **App Passwords**
3. Click **Generate New Password**
4. Select **Mail** as the application type
5. Copy the generated App Password (save it securely)

### 2. Get Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Create a new access token with admin permissions
3. Copy the token and set it as environment variable:
   ```bash
   export SUPABASE_ACCESS_TOKEN="your_token_here"
   ```

### 3. Configure SMTP Settings

#### Option A: Using the JavaScript Script
```bash
# Update the credentials in configure-smtp.js
node configure-smtp.js
```

#### Option B: Manual API Call
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/haordpdxyyreliyzmire/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_host": "smtp.zoho.com",
    "smtp_port": 587,
    "smtp_user": "noreply@ezcar24.com",
    "smtp_pass": "YOUR_APP_PASSWORD",
    "smtp_admin_email": "noreply@ezcar24.com",
    "smtp_sender_name": "EZCAR24",
    "smtp_max_frequency": 60
  }'
```

#### Option C: Using Supabase Dashboard
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Fill in the following details:
   - **Host:** smtp.zoho.com
   - **Port:** 587
   - **Username:** noreply@ezcar24.com
   - **Password:** [Your App Password]
   - **Sender name:** EZCAR24
   - **Admin email:** noreply@ezcar24.com

### 4. Update Email Templates

1. Go to **Authentication** → **Email Templates**
2. Update the following templates with professional HTML:

#### Password Recovery Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Use the template from email-templates.html -->
</div>
```

#### Email Confirmation Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Use the template from email-templates.html -->
</div>
```

### 5. Test Email Functionality

1. Open the admin panel: `/admin`
2. Click **"Test Email System"**
3. Enter a test email address
4. Test both **Password Reset** and **Magic Link** functionality
5. Check email delivery and spam folders

## 🔍 Troubleshooting

### Common Issues:

#### 1. Authentication Failed
- **Cause:** Wrong username or password
- **Solution:** Verify Zoho email and App Password

#### 2. Connection Timeout
- **Cause:** Firewall or network issues
- **Solution:** Check network connectivity and firewall settings

#### 3. Emails Going to Spam
- **Cause:** Domain reputation or missing SPF/DKIM records
- **Solution:** Configure SPF, DKIM, and DMARC records for ezcar24.com

#### 4. Rate Limiting
- **Cause:** Too many emails sent in short time
- **Solution:** Increase `smtp_max_frequency` or implement delays

### DNS Records for Better Deliverability:

#### SPF Record:
```
v=spf1 include:zoho.com ~all
```

#### DKIM Record:
```
Get from Zoho Mail → Settings → Email Hosting → DKIM
```

#### DMARC Record:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@ezcar24.com
```

## 📊 Monitoring

### Email Delivery Monitoring:
1. Check Zoho Mail sent folder
2. Monitor bounce rates
3. Check spam reports
4. Use email testing tools

### Supabase Logs:
1. Go to **Logs** → **Auth Logs**
2. Filter for email-related events
3. Check for errors and failures

## 🚀 Production Checklist

- [ ] SMTP credentials configured
- [ ] Email templates updated with branding
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Test emails sent successfully
- [ ] Password reset flow tested
- [ ] Email confirmation tested
- [ ] Magic link login tested
- [ ] Spam folder checked
- [ ] Delivery rates monitored

## 📞 Support

If you encounter issues:
1. Check Supabase Auth logs
2. Verify Zoho Mail settings
3. Test with different email providers
4. Contact Zoho Mail support for delivery issues
5. Contact Supabase support for API issues

## 🔐 Security Notes

- Never commit SMTP passwords to version control
- Use App Passwords instead of regular passwords
- Enable 2FA on Zoho Mail account
- Regularly rotate App Passwords
- Monitor for suspicious email activity
