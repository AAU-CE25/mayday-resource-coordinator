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
│   ├── page.tsx                   # Main dashboard (clean, uses hooks)
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
├── hooks/                         # Custom React hooks
│   ├── use-active-assignment.ts   # Manages volunteer assignment state
│   └── use-form-submit.ts         # Reusable form submission logic
│
├── lib/
│   ├── api-client.ts              # API calls with 5 HTTP methods + auto-logout
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

### Enhanced HTTP Methods
The API client now provides 5 generic HTTP methods with full type safety:

```typescript
import { get, post, put, patch, del } from "@/lib/api-client"

// Generic HTTP methods with TypeScript generics
const events = await get<Event[]>('/events')
const user = await post<User>('/auth/register', userData)
const updated = await put<Volunteer>('/volunteers/1', updateData)
const patched = await patch<Event>('/events/1', partialUpdate)
const result = await del<void>('/resources/1')

// All methods auto-include:
// ✓ Authorization header (Bearer token)
// ✓ Content-Type: application/json
// ✓ Error handling with auto-logout on 401
// ✓ Empty response handling (204 No Content)
```

### Available Functions
```typescript
// ====== Generic HTTP Methods ======
get<T>(endpoint)             // GET request with type safety
post<T>(endpoint, data?)     // POST with optional body
put<T>(endpoint, data?)      // PUT with optional body
patch<T>(endpoint, data?)    // PATCH with optional body
del<T>(endpoint)             // DELETE request

// ====== Auth ======
login(credentials)           // Login and store token
register(data)               // Create new account
getCurrentUser()             // Get current user data
logout()                     // Clear token
getAuthToken()               // Get token from sessionStorage
setAuthToken(token)          // Store token in sessionStorage
clearAuthToken()             // Remove token from sessionStorage

// ====== Events ======
fetchEvents()                // Get all events
fetchActiveVolunteers(id)    // Get volunteers for event

// ====== Volunteers ======
fetchUserVolunteers(userId)      // Get user's active volunteers
fetchAllUserVolunteers(userId)   // Get all volunteers (active + completed)
fetchUserEventVolunteers(u, e)   // Get volunteers by user & event
createVolunteer(userId, eventId) // Join an event
completeVolunteer(id)            // Leave an event
```

### Error Handling
```typescript
// Automatic 401 handling
try {
  const data = await get<Event[]>('/events')
} catch (error) {
  // 401 errors automatically:
  // 1. Clear token from sessionStorage
  // 2. Redirect to /login
  // 3. Show "Session expired" message
  
  // Other errors throw with message
  console.error(error.message)
}
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

## 🪝 Custom Hooks

### `useActiveAssignment(user)`
Manages the user's active volunteer assignment state.

**Purpose**: Extract complex business logic from page component
- Checks all events for user's active volunteer status
- Provides refresh and leave event functions
- Handles loading and error states

**Usage**:
```typescript
import { useActiveAssignment } from "@/hooks/use-active-assignment"

const { activeEvent, volunteerId, loading, error, refresh, leaveEvent } = useActiveAssignment(user)

// Check if user has active assignment
if (activeEvent) {
  console.log("User is volunteering at:", activeEvent.description)
}

// Manually refresh assignment status
await refresh()

// Leave current event
await leaveEvent()
```

**Returns**:
- `activeEvent`: Event | null - The event user is volunteering at
- `volunteerId`: number | null - ID of the volunteer record
- `loading`: boolean - Loading state
- `error`: Error | null - Any error that occurred
- `refresh`: () => Promise<void> - Manually check assignment
- `leaveEvent`: () => Promise<void> - Leave current event

### `useFormSubmit(options)`
Reusable form submission handler with loading and error states.

**Purpose**: Eliminate duplicate form handling logic across components
- Manages isSubmitting state
- Handles errors with callbacks
- Prevents default form submission

**Usage**:
```typescript
import { useFormSubmit } from "@/hooks/use-form-submit"

const { isSubmitting, error, handleSubmit, reset } = useFormSubmit({
  onSubmit: async (data) => {
    await post('/volunteers', data)
  },
  onSuccess: (data) => {
    toast({ title: "Success!" })
    onClose()
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" })
  }
})

// In your component:
<form onSubmit={(e) => handleSubmit(e, formData)}>
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

**Options**:
- `onSubmit`: (data: T) => Promise<void> - Async submission function
- `onSuccess?`: (data: T) => void - Success callback
- `onError?`: (error: Error) => void - Error callback

**Returns**:
- `isSubmitting`: boolean - Submission in progress
- `error`: Error | null - Last error that occurred
- `handleSubmit`: (e: FormEvent, data: T) => Promise<void> - Form handler
- `reset`: () => void - Reset states

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

### Architecture Pattern: Clean Separation
We follow a **hook-based architecture** where business logic is extracted from components into custom hooks.

### Global State
```typescript
// AuthContext (lib/auth-context.tsx)
- user: User | null
- isLoading: boolean
- login(), logout(), refreshUser()
```

### Custom Hooks (Business Logic Layer)
```typescript
// hooks/use-active-assignment.ts
// Manages volunteer assignment checking and state
const { activeEvent, volunteerId, loading, refresh, leaveEvent } = useActiveAssignment(user)

// hooks/use-form-submit.ts
// Reusable form submission with loading/error states
const { isSubmitting, error, handleSubmit, reset } = useFormSubmit({
  onSubmit: async (data) => { await api.post('/endpoint', data) },
  onSuccess: () => { toast("Success!") },
  onError: (error) => { toast(error.message) }
})
```

### Local State (page.tsx)
```typescript
// Minimal UI state only
- currentTab: which tab is currently visible (events/my-event/profile)

// Business logic moved to hooks:
- useActiveAssignment() handles all volunteer assignment logic
- No more manual useEffect loops in page component
```

### Benefits of Hook Architecture
✅ **Separation of Concerns**: UI components only handle rendering
✅ **Reusability**: Hooks can be used in multiple components
✅ **Testability**: Business logic can be tested independently
✅ **Maintainability**: Cleaner, smaller component files
✅ **Type Safety**: Full TypeScript support in hooks

## 🔄 Data Flow

### Complete Flow with Hooks

```
┌─────────────────────────────────────────────────────────────┐
│ User Action (click button)                                  │
│     ↓                                                        │
│ Component calls custom hook                                 │
│     ↓                                                        │
│ Hook calls api-client function                              │
│     ↓                                                        │
│ api-client adds token from sessionStorage                   │
│     ↓                                                        │
│ Fetch to backend API                                        │
│     ↓                                                        │
│ ┌───────────────────┬────────────────────┐                  │
│ │ Success           │ 401 Error          │                  │
│ │    ↓              │    ↓               │                  │
│ │ Return data       │ clearAuthToken()   │                  │
│ │    ↓              │    ↓               │                  │
│ │ Hook updates      │ Redirect to        │                  │
│ │ state             │ /login             │                  │
│ │    ↓              │    ↓               │                  │
│ │ Component         │ Show "Session      │                  │
│ │ re-renders        │ expired"           │                  │
│ └───────────────────┴────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Example: Joining an Event

```
User clicks "Join Event"
    ↓
EventDetailsDialog.tsx calls createVolunteer()
    ↓
api-client.ts → post<Volunteer>('/volunteers/', data)
    ↓
Backend creates volunteer record
    ↓
Response returns with volunteer data
    ↓
Dialog calls onVolunteerJoined() callback
    ↓
EventsFeed calls handleVolunteerJoined()
    ↓
page.tsx useActiveAssignment hook detects change
    ↓
Hook fetches updated event list
    ↓
Finds user's new volunteer assignment
    ↓
Updates activeEvent state
    ↓
page.tsx switches to "my-event" tab
    ↓
MyEventView component renders
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
**Version:** 3.0.0 (Hook-Based Architecture)

### Changelog v3.0.0
- ✅ Added custom hooks: `useActiveAssignment`, `useFormSubmit`
- ✅ Enhanced API client with 5 HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Extracted business logic from page.tsx (150 → 70 lines)
- ✅ Full type safety with no `any` types
- ✅ Improved error handling with 204 No Content support
- ✅ Updated documentation with hook patterns and data flow
