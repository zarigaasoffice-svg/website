# Firebase Functions for Admin Messages

This directory contains Firebase Cloud Functions for handling admin messages in the Zarigaas application.

## Features

- Email notifications for new messages
- Admin-only message management
- Image attachment handling
- Product reference support

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```
Select the following options:
- Functions: Configure a Cloud Functions directory and its files
- Use an existing project
- JavaScript
- Yes to ESLint
- Yes to installing dependencies

4. Run the setup script:
```bash
node setup.js
```
This will help you configure:
- Email settings
- Website URL
- Environment variables

5. Gmail Configuration:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled
   - Go to App Passwords
   - Create a new app-specific password for "Zarigaas Admin Notifications"
   - Use this password in the setup script

6. Deploy the functions:
```bash
npm run deploy
```

## Local Development

1. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

2. Start the Firebase emulators:
```bash
npm run serve
```

## Security Rules

The Firebase security rules are set up to:
- Allow authenticated users to create messages
- Allow users to read their own messages
- Allow admins to read and manage all messages
- Restrict message updates to admins only
- Enforce file size and type restrictions for attachments

## Environment Variables

- `EMAIL_USER`: Gmail address for sending notifications
- `EMAIL_PASSWORD`: App-specific password for Gmail
- `WEBSITE_URL`: Your website's URL for message links
- `SMTP_HOST`: SMTP server (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)

## Troubleshooting

1. Email Issues:
   - Verify your app-specific password is correct
   - Check spam folder for test emails
   - Ensure 2-Step Verification is enabled for Gmail

2. Deployment Issues:
   - Run `firebase login` to ensure you're authenticated
   - Check `firebase-debug.log` for detailed errors
   - Verify your project ID in `.firebaserc`

3. Function Errors:
   - Check function logs: `firebase functions:log`
   - Verify environment variables are set: `firebase functions:config:get`
   - Test locally using emulators: `npm run serve`

## Support

For issues or questions:
1. Check the Firebase Console logs
2. Review the Firebase documentation
3. Contact the development team