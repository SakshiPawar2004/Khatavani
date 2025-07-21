# Marathi Ledger Book (किर्दवही)

A digital ledger book application for schools and organizations to manage accounts and financial entries in Marathi language.

## Features

- **Account Management**: Create and manage multiple accounts
- **Entry Management**: Add जमा (credit) and नावे (debit) entries
- **Ledger Views**: View individual account ledgers and complete transaction history
- **Admin Dashboard**: Secure admin interface for full management
- **Export Functionality**: Export data to Excel format
- **Print Support**: Print-friendly layouts for physical records
- **Responsive Design**: Works on desktop and mobile devices
- **Firebase Integration**: Cloud-based data storage and real-time sync

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

## Installation & Setup

### 1. Download/Clone the Project

**Option A: Download ZIP**
- Download the project folder
- Extract it to your desired location

**Option B: Clone with Git**
```bash
git clone <repository-url>
cd marathi-ledger-book
```

### 2. Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required dependencies including:
- React
- TypeScript
- Tailwind CSS
- Firebase
- React Router
- Lucide React (icons)
- XLSX (Excel export)

### 3. Firebase Setup (Required)

The application uses Firebase for data storage. Follow these steps:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Get Firebase Configuration**:
   - In Firebase Console, go to Project Settings
   - Add a web app
   - Copy the configuration object

3. **Setup Environment Variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` file and replace the placeholder values with your actual Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
   VITE_FIREBASE_APP_ID=your-actual-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-actual-measurement-id
   ```

   **Important**: Never commit the `.env` file to version control. It's already added to `.gitignore`.

4. **Set Firestore Rules** (for development):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Running the Application

### Development Mode

To start the development server:

```bash
npm run dev
```

The application will be available at: `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Usage

### For Regular Users

1. **Access the Application**: Open `http://localhost:5173`
2. **View Accounts**: See the list of all accounts (खतावणी अनुक्रमणिका)
3. **View Ledger**: Click "किर्दवही बघा" to see all transactions
4. **View Individual Account**: Click on any account to see its detailed ledger

### For Administrators

1. **Admin Login**: Go to `http://localhost:5173/admin/login`
2. **Login Credentials**:
   - Username: `admin`
   - Password: `admin123`
3. **Admin Features**:
   - Add new accounts
   - Add जमा/नावे entries
   - Edit/delete accounts and entries
   - Export data to Excel
   - Print reports

## Project Structure

```
marathi-ledger-book/
├── src/
│   ├── components/          # React components
│   │   ├── TableOfContents.tsx
│   │   ├── LedgerPage.tsx
│   │   ├── EntryPage.tsx
│   │   ├── AdminLogin.tsx
│   │   └── AdminDashboard.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── services/          # Firebase services
│   │   └── firebaseService.ts
│   ├── config/           # Configuration files
│   │   └── firebase.ts
│   └── App.tsx           # Main app component
├── public/              # Static assets
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Account Management
- Create accounts with unique numbers and names
- Edit account names
- Delete accounts (removes all related entries)
- Numerical sorting (1,2,3...10,11,12)

### Entry Management
- Add जमा (credit) entries
- Add नावे (debit) entries
- Auto-fill account names
- Receipt number tracking
- Detailed descriptions

### Reports & Export
- Individual account ledgers
- Complete transaction history
- Excel export functionality
- Print-friendly layouts
- Balance calculations

### Security
- Admin authentication
- Protected routes
- Session management
- User/admin role separation

## Security Best Practices

### For Production Use:

1. **Environment Variables**:
   - Never commit `.env` files to version control
   - Use secure environment variable management in production
   - Rotate API keys regularly

1. **Update Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Change Default Admin Credentials**:
   - Update admin username and password
   - Use strong passwords
   - Consider implementing proper authentication

3. **Enable Firebase Security Features**:
   - Enable App Check
   - Set up proper authentication
   - Monitor usage and set quotas

## Troubleshooting

1. **Permission Denied Error**:
   - Check Firestore security rules
   - Ensure rules allow read/write access
   - Verify project configuration

2. **Environment Variables Error**:
   - Ensure `.env` file exists in project root
   - Check that all required variables are set
   - Restart development server after changing `.env`
   - Variables must start with `VITE_` prefix for Vite

2. **Network Errors**:
   - Check internet connection
   - Verify Firebase project is active
   - Check browser console for detailed errors

### Common Issues

1. **Firebase Connection Error**:
   - Check your Firebase configuration
   - Ensure Firestore is enabled
   - Verify internet connection

2. **Dependencies Error**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Port Already in Use**:
   - The app will automatically try different ports
   - Or specify a port: `npm run dev -- --port 3000`

### Browser Requirements

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (for Firebase)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Firebase setup
3. Ensure all dependencies are installed
4. Check internet connection

## License

This project is for educational and organizational use.

---

**Note**: Make sure to keep your Firebase credentials secure and never commit them to public repositories.