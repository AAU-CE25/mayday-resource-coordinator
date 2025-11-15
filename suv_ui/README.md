# SUV Response Portal

Mobile-first volunteer response application for field operations.

## Features

- 📱 **Mobile-First Design**: Optimized for phone screens (375px-428px)
- 🔄 **Real-Time Updates**: Events refresh every 30 seconds
- 🎯 **Two-Tab Navigation**: Events feed and user profile
- 🎨 **Light Mode UI**: Blue accent theme for daylight readability
- 📡 **API Integration**: Connects to backend at `localhost:8000`

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

The app will start on **port 3000**: http://localhost:3000

### Environment Variables

Create `.env.local` file (already configured):

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
suv_ui/
├── app/
│   ├── page.tsx           # Main app with tab routing
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles (light blue theme)
├── components/
│   ├── tab-navigation.tsx # Bottom tab bar
│   ├── event-card.tsx     # Individual event display
│   ├── events-feed.tsx    # Events list with API integration
│   └── profile-view.tsx   # User profile placeholder
└── lib/
    ├── types.ts           # TypeScript definitions
    └── api-client.ts      # API fetch utilities
```

## API Integration

The app fetches events from:
```
GET http://localhost:8000/events
```

Expected response format:
```json
[
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
]
```

## Mobile Testing

Test in browser DevTools with these viewports:
- iPhone SE: 375 x 667
- iPhone 12/13: 390 x 844
- iPhone 14 Pro Max: 428 x 926

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks (useState, useEffect)

