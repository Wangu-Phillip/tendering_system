/\*
Project Structure Documentation
===============================

/src
/components - Reusable React components
/pages - Page/screen components
/services - Business logic & external API integration
/context - React Context for state management
/hooks - Custom React hooks
/utils - Utility functions (formatters, validators, constants)
/types - TypeScript type definitions
/firebase - Firebase configuration and services
/assets - Static files (images, icons, fonts)
/styles - CSS and Tailwind configurations
App.tsx - Main application component
main.tsx - Entry point

/functions
Cloud Functions for Firebase - Handle tender creation events - Process bid submissions - Calculate statistics - Send notifications

KEY TECHNOLOGIES
================

- React 18: UI framework
- Vite: Fast build tool
- TypeScript: Type safety
- Tailwind CSS: Styling
- Firebase: Backend (Auth, Firestore, Storage, Cloud Functions)
- Chart.js: Data visualization
- Zod: Schema validation
- Zustand: State management (optional)
- Axios: HTTP client

DESIGN PATTERNS USED
====================

- Component composition
- Custom hooks for logic reuse
- Context API for global state
- Service layer for business logic
- Type-driven development
- Fire-and-forget async operations

FOLDER ORGANIZATION RATIONALE
=============================
This structure follows best practices for scalable React applications:

1. Separation of concerns (components, services, utils)
2. Atomic design principles
3. Easy to locate and scale
4. Clear dependency flow
5. Facilitates team collaboration
   \*/
