# BW Procurement System

A modern procurement and tendering platform built with React, Vite, Firebase, and TypeScript.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Charts**: Chart.js
- **State Management**: Zustand
- **Validation**: Zod

## Project Structure

```
tendering_system/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── services/           # API and external services
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── firebase/           # Firebase configuration and services
│   ├── assets/             # Images, icons, fonts
│   ├── styles/             # CSS files
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── functions/              # Cloud Functions
├── public/                 # Static files
├── firebase.json           # Firebase configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Features

### Dashboard

- Overview of tenders and bids
- Quick statistics
- Recent activity

### Tenders Management

- Create, view, and manage tenders
- Set budget, deadline, and categories
- Track bid submissions
- Upload supporting documents

### Bid Management

- Submit bids for open tenders
- View submitted bids
- Track evaluation status
- Receive feedback

### Analytics

- Bid statistics with Chart.js
- Tender performance metrics
- Pricing analysis

### User Roles

- Admin: Full system access
- Buyer: Create and manage tenders
- Vendor: Submit and track bids
- Reviewer: Evaluate bids

## Getting Started

### Prerequisites

- **Windows 10/11** (64-bit)
- **Node.js 18+** (installed automatically by the setup script if not present)

> **No other software is required.** All dependencies (React, Vite, TypeScript, Tailwind, etc.) are installed automatically via npm.

### Quick Setup (Recommended)

If you received this project as a zip file and don't have Node.js installed:

1. Extract the zip file
2. Right-click **`setup.bat`** → **Run as administrator**
3. The script will automatically:
   - Download and install Node.js (if not already installed)
   - Install all project dependencies
   - Create `.env.local` from the example template
   - Offer to start the development server
4. Edit `.env.local` with your Firebase credentials
5. The app will open at `http://localhost:3000`

### Manual Setup

1. Install [Node.js 18+](https://nodejs.org/) (npm is included)

2. Open a terminal in the project folder and install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
copy .env.example .env.local
# Edit .env.local with your Firebase credentials
```

4. Start the development server

```bash
npm run dev
```

5. Open `http://localhost:3000` in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Firebase Setup

### Firestore Collections

- `users` - User profiles and roles
- `tenders` - Tender listings
- `bids` - Bid submissions
- `evaluations` - Bid evaluations

### Cloud Functions

- `onTenderCreated` - Handle tender creation
- `onBidSubmitted` - Handle bid submission
- `calculateBidStats` - Calculate bid statistics

### Authentication

- Email/Password authentication
- Persistent login sessions
- Role-based access control

## Environmental Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
