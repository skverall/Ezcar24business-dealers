# Password Reset Troubleshooting Guide

## Overview
This guide helps troubleshoot password reset issues in the EZCAR24 application.

## Recent Changes Made

### 1. Supabase Configuration Updates
- **OTP Expiration**: Reduced from 43200 seconds (12 hours) to 3600 seconds (1 hour)
- **Auto-confirm**: Set to `false` for better security
- **Password Reauthentication**: Disabled for password updates

### 2. Code Improvements

#### ResetPassword.tsx
- Enhanced error handling for different error types
- Better logging for debugging
- Improved error messages for expired/invalid links
- Added support for various error codes (`otp_expired`, etc.)

#### ForgotPassword.tsx
- Added detailed logging for debugging
- Better error handling and user feedback

### 3. Test Page Created
- Created `/password-reset-test` page for testing functionality
- Shows environment configuration
- Allows testing password reset emails
- Displays session information

## Common Issues and Solutions

### Issue 1: "Invalid Reset Link" Error
**Symptoms**: User sees "Invalid Reset Link" message
**Causes**:
- Link has expired (now expires after 1 hour)
- Link was already used
- Invalid tokens in URL

**Solutions**:
1. Request a new password reset email
2. Check if link was clicked multiple times
3. Verify URL parameters are correct

### Issue 2: Email Not Received
**Symptoms**: User doesn't receive password reset email
**Causes**:
- Email in spam folder
- Rate limiting (max 200 emails per hour)
- SMTP configuration issues

**Solutions**:
1. Check spam/junk folder
2. Wait and try again if rate limited
3. Verify SMTP settings in Supabase

### Issue 3: Session Errors
**Symptoms**: "Session expired" errors during password update
**Causes**:
- Tokens expired before password update
- Invalid session state

**Solutions**:
1. Request new reset link
2. Complete password reset quickly after clicking link
3. Check browser console for detailed errors

## Testing Procedures

### 1. Test Password Reset Flow
1. Go to `/password-reset-test`
2. Enter test email address
3. Click "Test Password Reset"
4. Check email for reset link
5. Click reset link and verify it works

### 2. Test Error Handling
1. Go to `/reset-password?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`
2. Verify proper error message is displayed
3. Test "Request New Reset Link" button

### 3. Test Valid Reset Flow
1. Request password reset via `/forgot-password`
2. Check email and click reset link
3. Enter new password and confirm
4. Verify successful password update

## Configuration Details

### Supabase Auth Settings
- **Site URL**: `https://ezcar24.com`
- **Redirect URLs**: Includes localhost and production URLs
- **OTP Expiration**: 3600 seconds (1 hour)
- **Email Templates**: Custom branded templates
- **SMTP**: Configured with Zoho

### URL Configuration
- **Production**: `https://ezcar24.com/reset-password`
- **Development**: `http://localhost:8080/reset-password`
- **Auto-detection**: Based on hostname

## Monitoring and Logs

### Browser Console
- Check for detailed error messages
- Look for session and authentication logs
- Verify URL parameters are parsed correctly

### Supabase Dashboard
- Monitor auth logs
- Check email delivery status
- Review rate limiting metrics

## Emergency Procedures

### If Password Reset is Completely Broken
1. Use admin panel to reset user passwords directly
2. Check Supabase auth configuration
3. Verify SMTP settings
4. Test with `/password-reset-test` page

### If Users Are Locked Out
1. Use emergency admin password reset SQL script
2. Manually update user passwords in database
3. Clear failed login attempts

## Contact Information
For technical issues, check:
1. Browser console logs
2. Supabase dashboard logs
3. Email delivery logs
4. Test page results at `/password-reset-test`
