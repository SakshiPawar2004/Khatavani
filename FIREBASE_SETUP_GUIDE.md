# Firebase Setup Guide for Marathi Ledger Book

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `marathi-ledger-book`
   - Enable Google Analytics (optional)
   - Click "Create project"

## Step 2: Setup Firestore Database

1. **Create Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location closest to your users
   - Click "Done"

2. **Configure Security Rules (Optional - for production)**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to all documents
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## Step 3: Get Firebase Configuration

1. **Add Web App**
   - In Firebase Console, click the web icon (</>) to add a web app
   - Enter app nickname: `marathi-ledger-web`
   - Don't check "Firebase Hosting" for now
   - Click "Register app"

2. **Copy Configuration**
   - Copy the Firebase configuration object
   - It will look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id-here"
   };
   ```

## Step 4: Update Firebase Configuration

1. **Update Configuration File**
   - Open `src/config/firebase.ts`
   - Replace the placeholder values with your actual Firebase config:

   ```typescript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-actual-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-actual-sender-id",
     appId: "your-actual-app-id"
   };
   ```

## Step 5: Test the Connection

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Account Management**
   - Go to http://localhost:5173
   - Try adding a new account
   - Check Firebase Console > Firestore Database to see if data appears

3. **Test Entry Management**
   - Go to "नवीन नोंद जोडा" page
   - Add जमा and नावे entries
   - Verify entries appear in Firebase Console

## Step 6: Firestore Collections Structure

The app will automatically create these collections:

### Accounts Collection (`accounts`)
```javascript
{
  id: "auto-generated-id",
  khateNumber: "1",
  name: "राम शर्मा",
  createdAt: Timestamp
}
```

### Entries Collection (`entries`)
```javascript
{
  id: "auto-generated-id",
  date: "2025-01-15",
  accountNumber: "1",
  receiptNumber: "R001",
  details: "राम शर्मा\nपैसे जमा केले",
  amount: 1000.00,
  type: "जमा",
  createdAt: Timestamp
}
```

## Features Available with Firebase

✅ **Real-time Sync**: Data syncs across all devices instantly
✅ **Cloud Storage**: All data stored securely in Google Cloud
✅ **Offline Support**: Basic offline functionality with Firebase SDK
✅ **Scalability**: Handles thousands of accounts and entries
✅ **Backup**: Automatic cloud backup of all data
✅ **Multi-device**: Access from any device with internet
✅ **Data Validation**: Server-side validation and security
✅ **Error Handling**: Comprehensive error handling for network issues

## Security Best Practices

### For Production Use:

1. **Update Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Only allow authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Enable Authentication** (Optional)
   - Go to Firebase Console > Authentication
   - Enable Email/Password or Google Sign-in
   - Update security rules to require authentication

3. **Restrict API Keys**
   - Go to Google Cloud Console
   - Restrict API keys to specific domains
   - Enable only necessary APIs

## Troubleshooting

1. **Permission Denied Error**
   - Check Firestore security rules
   - Ensure rules allow read/write access
   - Verify project configuration

2. **Network Errors**
   - Check internet connection
   - Verify Firebase project is active
   - Check browser console for detailed errors

3. **Data Not Syncing**
   - Check Firebase Console for data
   - Verify collection names match code
   - Check browser network tab for failed requests

## Monitoring and Analytics

1. **Firebase Console Dashboard**
   - Monitor database usage
   - Track read/write operations
   - View error logs

2. **Performance Monitoring**
   - Enable Performance Monitoring in Firebase
   - Track app performance metrics
   - Monitor user engagement

## Backup and Export

1. **Automatic Backups**
   - Firebase automatically backs up your data
   - Data is replicated across multiple regions

2. **Manual Export**
   - Use Firebase CLI to export data
   - Export to JSON format for local backup

Your Marathi Ledger Book is now connected to Firebase! 🚀

## Next Steps

- Test all functionality with Firebase
- Set up proper security rules for production
- Consider enabling Firebase Authentication
- Monitor usage in Firebase Console
- Set up automated backups if needed