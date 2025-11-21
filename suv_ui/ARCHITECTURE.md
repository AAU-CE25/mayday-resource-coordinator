# SUV UI - Clean Architecture

## 📁 Project Structure

```
suv_ui/
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Register page
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Main dashboard
│   └── globals.css                # Global styles
│
├── components/
│   └── app/                       # App-specific components
│       ├── event-card.tsx         # Event card component
│       ├── event-details-dialog.tsx # Event details modal
│       ├── events-feed.tsx        # Events list view
│       ├── my-event-view.tsx      # Active event view
│       ├── profile-view.tsx       # User profile view
│       └── tab-navigation.tsx     # Bottom navigation tabs
│
├── lib/
│   ├── api-client.ts              # API calls with auto-logout
│   ├── auth-context.tsx           # Authentication state & redirect
│   └── types.ts                   # TypeScript types
│
└── .env.local                     # Environment variables
```

## 🔐 Authentication Flow

### Simple & Secure
- **sessionStorage** - Token expires when browser closes
- **Auto-redirect** - Unauthenticated users → `/login`
- **Auto-logout** - On 401 errors from API

### How It Works

```
┌──────────────────────────────────────────────────────┐
│  User visits any page                                │
│         ↓                                            │
│  AuthContext checks sessionStorage                   │
│         ↓                                            │
│  ┌──────────────┐         ┌──────────────┐           │
│  │ Has token?   │──No──→  │ Redirect to  │           │
│  │              │         │   /login     │           │
│  └──────────────┘         └──────────────┘           │
│         │                                            │
│        Yes                                           │
│         ↓                                            │
│  Fetch user data from API                            │
│         ↓                                            │
│  ┌──────────────┐         ┌──────────────┐           │
│  │ API success? │──No──→  │ Clear token  │           │
│  │              │         │ Redirect     │           │
│  └──────────────┘         └──────────────┘           │
│         │                                            │
│        Yes                                           │
│         ↓                                            │
│  Show app content                                    │
└──────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the App
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register
- App: http://localhost:3000/ (redirects to login if not authenticated)

## 📝 Key Features

### ✅ No Auto-Refresh Loops
- Removed 10-second polling interval
- Added manual refresh button in header
- useEffect runs once per user change

### ✅ Clean Page Structure
- `/login` - Login form
- `/register` - Registration form
- `/` - Main dashboard with tabs
  - Events tab - Browse available events
  - My Event tab - View active assignment
  - Profile tab - User profile & stats

### ✅ Secure Session Management
```typescript
// api-client.ts automatically handles:
- sessionStorage (expires on browser close)
- Auto-logout on 401 (session expired)
- Error handling with user-friendly messages
```

### ✅ Simple Auth Context
```typescript
// lib/auth-context.tsx
const { user, isLoading, login, logout, refreshUser } = useAuth()

// Auto-redirects:
// - No token → /login
// - Valid token on /login → /
// - Invalid token → /login
```

## 🔧 API Client

### Usage
```typescript
import { fetchEvents, createVolunteer } from "@/lib/api-client"

// All functions auto-include token from sessionStorage
const events = await fetchEvents()
const volunteer = await createVolunteer(userId, eventId)

// On 401 error: auto-logout + redirect to /login
```

### Available Functions
```typescript
// Auth
login(credentials)           // Login and store token
register(data)               // Create new account
getCurrentUser()             // Get current user data
logout()                     // Clear token

// Events
fetchEvents()                // Get all events
fetchActiveVolunteers(id)    // Get volunteers for event

// Volunteers
fetchUserVolunteers(userId)  // Get user's active volunteers
createVolunteer(u, e)        // Join an event
completeVolunteer(id)        // Leave an event
```

## 🎨 Component Organization

### App Components (`components/app/`)
These are the main UI components:

- **event-card.tsx** - Individual event card display
- **event-details-dialog.tsx** - Modal with event details & join button
- **events-feed.tsx** - List of all available events
- **my-event-view.tsx** - Active event details for volunteer
- **profile-view.tsx** - User profile with stats
- **tab-navigation.tsx** - Bottom nav bar

### Usage Example
```typescript
import { EventsFeed } from "@/components/app/events-feed"

export default function Page() {
  return <EventsFeed />
}
```

## 🐛 Troubleshooting

### Page keeps refreshing
✅ **FIXED** - Removed polling interval. Now uses manual refresh button.

### Can't login
- Check backend is running on `http://localhost:8000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check console for error messages

### Stuck on loading screen
- Clear sessionStorage: `sessionStorage.clear()`
- Refresh page
- Check auth token validity

### Not redirecting to /login
- Check `lib/auth-context.tsx` useEffect
- Verify no token in sessionStorage
- Check console for errors

## 📊 State Management

### Global State
```typescript
// AuthContext (lib/auth-context.tsx)
- user: User | null
- isLoading: boolean
- login(), logout(), refreshUser()
```

### Local State (page.tsx)
```typescript
- activeTab: which tab is selected
- myActiveEvent: user's current volunteer assignment
- myVolunteerId: ID of active volunteer record
- loading: data fetching state
```

## 🔄 Data Flow

```
User Action (click button)
    ↓
Component calls api-client function
    ↓
api-client adds token from sessionStorage
    ↓
Fetch to backend API
    ↓
┌─────────────┬──────────────┐
│ Success     │ 401 Error    │
│    ↓        │    ↓         │
│ Return data │ Auto-logout  │
│    ↓        │ Redirect     │
│ Update UI   │ to /login    │
└─────────────┴──────────────┘
```

## ⚡ Performance

### Optimizations
- ✅ No polling loops
- ✅ Manual refresh only when needed
- ✅ sessionStorage (faster than localStorage)
- ✅ Minimal re-renders (proper useEffect dependencies)

### Loading States
- Initial load: Full screen spinner
- Data fetch: Component-level spinners
- Refresh: Button spinner icon

## 🔒 Security

### What's Secure
✅ sessionStorage (expires on browser close)
✅ Auto-logout on session expiry
✅ Token included in Authorization header
✅ No token in URL or visible in DOM

### What's NOT (for future)
⚠️ Still client-side token storage
⚠️ No HTTPS enforcement (needed in production)
⚠️ No refresh tokens
⚠️ No rate limiting

## 🎯 Next Steps

### Recommended Improvements
1. Add refresh tokens for longer sessions
2. Add loading skeletons instead of spinners
3. Add error boundaries for better error handling
4. Add offline support with service workers
5. Add unit tests for components
6. Add E2E tests for auth flow

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** November 21, 2025
**Version:** 2.0.0 (Clean Architecture)
