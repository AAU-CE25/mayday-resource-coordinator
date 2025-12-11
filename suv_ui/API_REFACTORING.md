# API Refactoring Summary

## ✅ Completed

### New Hooks Created
1. **`hooks/use-auth.ts`** - Re-exports useAuth from auth-context
2. **`hooks/use-users.ts`** - User management operations
3. **`hooks/use-events.ts`** - Event fetching operations
4. **`hooks/use-volunteers.ts`** - Volunteer assignment operations
5. **`hooks/use-resources.ts`** - Resource management operations
6. **`hooks/index.ts`** - Central export for all hooks

### Updated Files
1. **`lib/auth-context.tsx`** - Added `loginWithCredentials()` and `registerUser()` functions
2. **`lib/api-client.ts`** - Removed all domain-specific functions, kept only core HTTP methods and auth API calls

### Core API Client Structure
The `api-client.ts` now contains ONLY:
- Core HTTP methods: `get()`, `post()`, `put()`, `patch()`, `del()`
- Token management: `getAuthToken()`, `setAuthToken()`, `clearAuthToken()`
- Auth API calls: `login()`, `register()`, `getCurrentUser()`, `logout()`
- Generic `apiFetch()` wrapper with error handling

## 🔄 Needs Update

### Hooks That Need Fixing
1. **`hooks/use-active-assignment.ts`** ✅ FIXED - Now uses `useEvents()` and `useVolunteers()`
2. **`hooks/use-volunteer-stats.ts`** ✅ FIXED - Now uses `useVolunteers()`
3. **`hooks/use-user-profile.ts`** - Still importing from old api-client

### Components That Need Updating
1. **`components/app/profile-view.tsx`** - Imports: fetchEvents, getUserVolunteerProfile, updateUser, fetchVolunteerResources, updateResource
2. **`components/app/events-feed.tsx`** - Imports: fetchEvents, fetchActiveVolunteers  
3. **`components/app/my-event-view.tsx`** - Imports: fetchResourcesAvailableForEvent, fetchResourcesNeededForEvent, fetchVolunteerResources, updateResource, fetchAllUserVolunteers
4. **`components/app/resources-manager.tsx`** - Needs checking
5. **`components/app/event-details-dialog.tsx`** - Imports: createVolunteer

### Pages That Need Updating
1. **`app/login/page.tsx`** - Should use `auth.loginWithCredentials()` instead of separate apiLogin + login
2. **`app/register/page.tsx`** - Should use `auth.registerUser()` instead of separate apiRegister + apiLogin + login

## 📋 Migration Guide

### For Components:
Instead of:
```typescript
import { fetchEvents } from "@/lib/api-client"
const events = await fetchEvents()
```

Use:
```typescript
import { useEvents } from "@/hooks"
const { fetchEvents } = useEvents()
const events = await fetchEvents()
```

### For Auth:
Instead of:
```typescript
import { login as apiLogin } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
await apiLogin(credentials)
await auth.login()
```

Use:
```typescript
import { useAuth } from "@/hooks"
const { loginWithCredentials } = useAuth()
await loginWithCredentials(credentials)
```

## 🎯 Benefits

1. **Better Organization** - Each domain has its own hook
2. **Cleaner Imports** - Single import from `@/hooks`
3. **Built-in State Management** - Each hook manages loading/error states
4. **Easier Testing** - Mock hooks instead of individual functions
5. **Better Type Safety** - TypeScript can infer types from hooks
6. **Separation of Concerns** - API client is now truly generic
