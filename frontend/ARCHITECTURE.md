# Frontend Architecture

## Overview

The Mayday Resource Coordinator frontend is a Next.js 16 application built with React, TypeScript, and Tailwind CSS. It provides a real-time emergency coordination dashboard for managing events, volunteers (users), and resources.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **React Query** | Server state management & caching |
| **Leaflet** | Interactive map rendering |
| **shadcn/ui** | UI component library |

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main entry point
│   ├── globals.css         # Global styles
│   └── api/                # API route handlers (proxy)
│       └── resources/
│           └── allocate/
│               └── route.ts  # Resource allocation proxy
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   │
│   ├── dashboard/          # Main dashboard components
│   │   ├── emergency-dashboard.tsx   # Main dashboard container
│   │   ├── dashboard-header.tsx      # Top navigation bar
│   │   ├── side-panel.tsx            # Right sidebar with tabs
│   │   ├── monitoring-stats.tsx      # Stats overview cards
│   │   ├── map-view.tsx              # Leaflet map component
│   │   ├── map-filter-pane.tsx       # Map filter controls
│   │   └── live-status-indicator.tsx # Connection status
│   │
│   ├── lists/              # Data display components
│   │   ├── events-list.tsx           # Emergency events list
│   │   ├── user-list.tsx             # Users/volunteers list
│   │   ├── resources-list.tsx        # Resources inventory
│   │   ├── activity-feed.tsx         # Activity log
│   │   └── notifications-popover.tsx # Notifications dropdown
│   │
│   ├── dialogs/            # Modal dialog components
│   │   ├── create-event-dialog.tsx       # Create new event
│   │   ├── assign-to-event-dialog.tsx    # Assign user to event
│   │   ├── assign-volunteer-dialog.tsx   # Assign volunteer
│   │   ├── add-volunteer-dialog.tsx      # Register new user
│   │   ├── add-resource-dialog.tsx       # Add resource
│   │   ├── assign-resource-dialog.tsx    # Assign resource
│   │   ├── allocate-resource-dialog.tsx  # Allocate to event
│   │   └── assign-to-volunteer-dialog.tsx
│   │
│   └── providers.tsx       # React Query provider wrapper
│
├── hooks/                  # Custom React hooks
│   ├── use-activity.ts     # Activity feed data
│   ├── use-events.ts       # Events data fetching
│   ├── use-invalidate-queries.ts  # Query invalidation helpers
│   ├── use-notifications.ts # Notifications data
│   ├── use-resources-available.ts # Available resources
│   ├── use-resources-needed.ts    # Needed resources
│   ├── use-stats.ts        # Dashboard statistics
│   ├── use-toast.ts        # Toast notifications
│   └── use-users.ts        # Users data fetching
│
├── lib/                    # Utilities and API client
│   ├── api-client.ts       # HTTP client & API functions
│   └── utils.ts            # Helper functions
│
└── public/                 # Static assets
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │    Lists    │  │      Dialogs        │  │
│  │  Components │  │  Components │  │     Components      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
├─────────┴────────────────┴─────────────────────┴─────────────┤
│                      UI COMPONENTS                           │
│              (shadcn/ui primitives)                          │
├──────────────────────────────────────────────────────────────┤
│                     HOOKS LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │useEvents │  │ useUsers │  │useResour.│  │ useStats │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │            │
├───────┴─────────────┴─────────────┴─────────────┴────────────┤
│                    DATA LAYER                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   React Query                          │  │
│  │         (Caching, Refetching, Mutations)               │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
├───────────────────────────┴──────────────────────────────────┤
│                    API CLIENT                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              lib/api-client.ts                         │  │
│  │    (HTTP requests to backend API)                      │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┴──────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Backend API         │
                │   (FastAPI @ :8000)   │
                └───────────────────────┘
```

## Component Hierarchy

```
App (layout.tsx)
└── QueryClientProvider (providers.tsx)
    └── EmergencyDashboard
        ├── Header
        │   └── NotificationsPopover
        │
        ├── MonitoringStats
        │   └── LiveStatusIndicator
        │
        ├── MapFilterPane
        │
        ├── MapView (Leaflet)
        │
        └── SidePanel
            ├── EventsList
            │   ├── CreateEventDialog
            │   └── AssignToEventDialog
            │
            ├── UserList
            │   ├── AddVolunteerDialog
            │   └── AssignVolunteerDialog
            │
            └── ResourcesList
                ├── AddResourceDialog
                ├── AllocateResourceDialog
                └── AssignResourceDialog
```

## Data Flow

### 1. Server State Management (React Query)

All server data is managed through React Query hooks:

```typescript
// Example: useEvents hook
const { data: events, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: () => api.get('/events/'),
  refetchInterval: 5000,  // Auto-refresh every 5s
});
```

### 2. Cache Invalidation

After mutations, related queries are invalidated to refresh data:

```typescript
// After creating an event
queryClient.invalidateQueries({ queryKey: ['events'] });
queryClient.invalidateQueries({ queryKey: ['stats'] });
```

### 3. Real-time Updates

The dashboard polls the API at regular intervals:
- **Events**: 5 second refresh
- **Stats**: 5 second refresh  
- **Resources**: 3 second refresh

## Key Design Patterns

### 1. Component Organization

Components are grouped by **feature/purpose**:
- `dashboard/` - Layout and navigation
- `lists/` - Data display and filtering
- `dialogs/` - User input modals
- `ui/` - Reusable primitives

### 2. Hooks for Data Fetching

Each data entity has a dedicated hook:
```typescript
// hooks/use-events.ts
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.getAll,
  });
}
```

### 3. API Client Abstraction

All HTTP requests go through `lib/api-client.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  get: (endpoint) => fetch(`${API_BASE}${endpoint}`).then(handleResponse),
  post: (endpoint, data) => fetch(...).then(handleResponse),
  put: (endpoint, data) => fetch(...).then(handleResponse),
  delete: (endpoint) => fetch(...).then(handleResponse),
};
```

## Domain Model

### User
A registered individual in the system.

### Volunteer
When a User is assigned to an Event (has `event_id`), they become a Volunteer for that event.

### Event
An emergency incident requiring coordination of volunteers and resources.

### Resource
Equipment, vehicles, or supplies that can be allocated to events or assigned to volunteers.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /events/` | List all events |
| `POST /events/` | Create new event |
| `GET /users/` | List all users |
| `PUT /users/:id` | Update user (assign to event) |
| `GET /resources/available/` | Available resources |
| `GET /resources/needed/` | Needed resources |
| `POST /resources/allocate` | Allocate resource to event |
| `GET /stats/` | Dashboard statistics |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Future Improvements

1. **TypeScript Strictness**: Add proper types to replace `any` usage
2. **Error Boundaries**: Add React error boundaries for graceful failures
3. **Optimistic Updates**: Implement optimistic UI for better UX
4. **WebSocket**: Replace polling with WebSocket for real-time updates
5. **Testing**: Add unit and integration tests
6. **Accessibility**: Improve ARIA labels and keyboard navigation
