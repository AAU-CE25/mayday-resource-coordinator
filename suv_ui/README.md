# SUV Response Portal

Mobile-first volunteer response application for field operations.

## Features

- 📱 **Mobile-First Design**: Optimized for phone screens (375px-428px)
- 🔄 **Manual Refresh**: On-demand refresh button (no aggressive polling)
- 🎯 **Three-Tab Navigation**: Events feed, my event, and profile
- 🔐 **Secure Authentication**: sessionStorage with auto-logout on 401
- 🎨 **Light Mode UI**: Blue accent theme for daylight readability
- 📡 **API Integration**: Connects to backend at `localhost:8000`
- 🪝 **Custom Hooks**: Clean architecture with business logic separation
- � **Real-time Stats**: Profile shows actual volunteer hours and history
- 🚫 **Smart Validation**: Prevents joining multiple events simultaneously
- �🔧 **Type Safety**: Full TypeScript support throughout
- ⚡ **Backend Filtering**: Efficient server-side queries with status/user/event filters

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd suv_ui
npm install
```

### Development

```bash
npm run dev
```

The app will start on **port 3030**: http://localhost:3030

### Environment Variables

Create `.env.local` file (already configured):

```env
PORT=3030
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
suv_ui/
├── app/
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── page.tsx           # Main app with tab routing (clean architecture)
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── globals.css        # Global styles (light blue theme)
├── components/
│   └── app/               # App-specific components
│       ├── tab-navigation.tsx        # Bottom tab bar
│       ├── event-card.tsx            # Individual event display
│       ├── event-details-dialog.tsx  # Event details modal with join prevention
│       ├── events-feed.tsx           # Events list with API integration
│       ├── my-event-view.tsx         # Active assignment view
│       └── profile-view.tsx          # User profile with stats & history
├── hooks/                 # Custom React hooks (business logic)
│   ├── use-active-assignment.ts      # Volunteer assignment state
│   ├── use-form-submit.ts            # Reusable form handling
│   └── use-volunteer-stats.ts        # Profile statistics calculation
└── lib/
    ├── types.ts           # TypeScript definitions
    ├── api-client.ts      # API client with 5 HTTP methods + auth
    └── auth-context.tsx   # Authentication state & auto-redirect
```

## API Integration

### Key Endpoints

**Events:**
```
GET http://localhost:8000/events
```

**Volunteers (with flexible filtering):**
```
GET http://localhost:8000/volunteers/?user_id={id}&status=active
GET http://localhost:8000/volunteers/?event_id={id}&status=completed
GET http://localhost:8000/volunteers/?user_id={id}&event_id={id}&status=active
```

**Authentication:**
```
POST http://localhost:8000/auth/login
POST http://localhost:8000/auth/register
GET  http://localhost:8000/auth/me
```

### Response Format Examples

**Event Response:**
```json
{
  "id": 1,
  "description": "Emergency event description",
  "priority": 1,
  "status": "active",
  "create_time": "2025-11-15T10:00:00Z",
  "modified_time": "2025-11-15T10:30:00Z",
  "location": {
    "id": 1,
    "address": {
      "city": "Aalborg",
      "street": "Main St"
    },
    "latitude": 57.048,
    "longitude": 9.935
  }
}
```

**Volunteer Response:**
```json
{
  "id": 13,
  "user": {
    "id": 21,
    "name": "John Doe",
    "email": "john@example.com",
    "phonenumber": "+4512345678"
  },
  "event_id": 7,
  "status": "completed",
  "create_time": "2025-11-21T15:54:17.684431",
  "completion_time": "2025-11-21T18:30:25.638677"
}
```

## Mobile Testing

Test in browser DevTools with these viewports:
- iPhone SE: 375 x 667
- iPhone 12/13: 390 x 844
- iPhone 14 Pro Max: 428 x 926

## Architecture Highlights

### Clean Architecture Pattern
- **Custom Hooks**: Business logic extracted from components
  - `useActiveAssignment`: Manages volunteer assignment state
  - `useFormSubmit`: Reusable form submission logic
  - `useVolunteerStats`: Calculates profile statistics with real-time data
- **API Client**: 5 HTTP methods (GET, POST, PUT, PATCH, DELETE) with auto-auth
- **Backend Filtering**: Efficient queries using `?user_id`, `?event_id`, `?status` params
- **Type Safety**: Full TypeScript throughout with no `any` types
- **Error Handling**: Automatic 401 logout + redirect
- **Smart Validation**: Prevents multiple simultaneous event assignments

### Authentication Flow
```
User → sessionStorage (token) → API Client → Backend
                ↓
           401 Error? → Auto-logout → Redirect to /login
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete documentation.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: React 19 hooks + Custom hooks
- **Auth**: sessionStorage with auto-redirect

## File	One-Line Purpose
package.json	Lists dependencies & scripts
package-lock.json	Locks exact versions
tsconfig.json	TypeScript settings
next.config.ts	Next.js settings
eslint.config.mjs	Code quality rules
postcss.config.mjs	CSS processing (Tailwind)
.env.local	Secret variables
.env.local.example	Template for .env.local
next-env.d.ts	Next.js TypeScript types
.gitignore	What git should ignore
