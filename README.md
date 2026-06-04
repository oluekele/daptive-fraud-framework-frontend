# Adaptive Fraud Framework - Frontend Application

A Next.js-based web application for capturing and visualizing behavioral telemetry data for fraud detection analysis.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Features](#features)
- [User Interface Components](#user-interface-components)
- [Telemetry Capture](#telemetry-capture)
- [API Integration](#api-integration)
- [Development](#development)
- [Deployment](#deployment)

## Overview

This frontend application provides an interactive console for:

- **User Authentication**: Login and registration functionality
- **Session Management**: View active session details, load session history, and end the active session
- **Behavioral Telemetry Capture**: Real-time capture of user interactions including:
  - Keyboard events (keydown, keyup)
  - Mouse events (movement, clicks)
  - Touch events (mobile/touchscreen interactions)
  - Scroll events
- **Data Visualization**: Real-time visualization of captured telemetry data
- **Dataset Generation**: Export session data for analysis
- **Feature Extraction**: Generate and retrieve stored behavioral features
- **Risk Scoring**: Calculate, save, and retrieve session risk scores

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Build Tool**: Next.js built-in compiler
- **Linting**: ESLint 9

## Project Structure

```
app/
├── layout.tsx           # Root layout with global styles
├── page.tsx             # Main application page (telemetry console)
├── globals.css          # Global styles and Tailwind directives
└── favicon.ico          # Application favicon

public/                  # Static assets
├── file.svg
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg

package.json             # Dependencies and scripts
tsconfig.json            # TypeScript configuration
next.config.ts           # Next.js configuration
postcss.config.mjs       # PostCSS configuration
eslint.config.mjs        # ESLint configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- Backend API running (see backend/nestjs-api README)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend/nextjs-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env.local` file in the root directory to configure the API endpoint:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

### Running the Application

**Development mode**:
```bash
npm run dev
```

The application will start on `http://localhost:3001` (or the next available port).

**Production build**:
```bash
npm run build
npm run start
```

**Linting**:
```bash
npm run lint
```

## Features

### 1. Authentication
- **Login**: Authenticate with existing credentials
- **Register**: Create a new account
- Automatic session creation upon successful authentication
- JWT token management for authenticated requests

### 2. Telemetry Capture
The application captures the following user interactions:

- **Keyboard Events**
  - Key down/up events
  - Key codes and values
  - Timestamps

- **Mouse Events**
  - Mouse movement tracking
  - Click events (with button information)
  - Position coordinates relative to viewport

- **Touch Events**
  - Touch movement on mobile/touchscreen devices
  - Touch coordinates

- **Scroll Events**
  - Scroll position tracking
  - Scroll height information

### 3. Real-time Metrics Dashboard
- **Event Counter**: Total number of captured events
- **Event Breakdown**: Keyboard, mouse, scroll, and touch event counts
- **Live Session Status**: Visual indicator of active/idle session
- **Session Information**: Display current session ID and user

### 4. Data Visualization

#### Behavior Flow Panel
- Interactive area for capturing user interactions
- Visual feedback for different event types
- Real-time event visualization

#### Overview Chart
- Bar chart showing distribution of event types
- Color-coded for easy interpretation:
  - Green: Keyboard events
  - Blue: Mouse events
  - Amber: Scroll events
  - Violet: Touch events

#### Movement Heatmap
- Visual representation of mouse/touch movement patterns
- Click location indicators
- Helps identify user interaction patterns

#### Signal Line Chart
- Continuous signal visualization
- Shows event frequency and type distribution over time
- Dual-line representation for different event categories

#### Event Table
- Detailed list of recent telemetry events
- Shows event type, payload data, and timestamp
- Scrollable list with up to 18 recent events

### 5. Dataset Generation
- Export session telemetry data
- JSON format for easy analysis
- Includes summary statistics and raw event data

### 6. Feature Extraction and Risk Scoring
- Generate features through `POST /features/generate`
- Retrieve stored features through `GET /features`
- Calculate risk through `POST /risk/calculate`
- Retrieve risk history through `GET /risk`
- Display latest risk level and score in the sidebar

## User Interface Components

### Header
- Application title and branding
- Real-time metrics display (Events, Keyboard, Mouse, Scroll counts)

### Sidebar
- **Authentication Panel**: Login/Register form with mode toggle
- **Session Panel**: Session status, ID display, and controls
  - Record/Pause button
  - Dataset generation button
- **API Status Panel**: Connection status and API endpoint information

### Main Content Area
- **Behavior Flow**: Interactive capture area with visual elements
- **Overview Chart**: Event distribution visualization
- **Movement Heatmap**: Spatial interaction patterns
- **Signal Line**: Temporal event patterns
- **Event Table**: Detailed event log
- **Dataset Panel**: JSON output preview

## Telemetry Capture

### Event Types and Data Collected

#### Keyboard Events
```typescript
{
  key: string;        // Key value (e.g., "a", "Enter")
  code: string;       // Physical key code (e.g., "KeyA", "Enter")
  timestamp: number;  // Unix timestamp
}
```

#### Mouse Events
```typescript
// Mouse Move
{
  x: number;          // X coordinate relative to container
  y: number;          // Y coordinate relative to container
  width: number;      // Container width
  height: number;     // Container height
  timestamp: number;  // Unix timestamp
}

// Mouse Click
{
  x: number;          // X coordinate
  y: number;          // Y coordinate
  button: number;     // Mouse button (0=left, 1=middle, 2=right)
  timestamp: number;  // Unix timestamp
}
```

#### Touch Events
```typescript
{
  x: number;          // Touch X coordinate
  y: number;          // Touch Y coordinate
  width: number;      // Container width
  height: number;     // Container height
  timestamp: number;  // Unix timestamp
}
```

#### Scroll Events
```typescript
{
  scrollTop: number;      // Current scroll position
  scrollHeight: number;   // Total scrollable height
  timestamp: number;      // Unix timestamp
}
```

### Capture Controls

- **Record Button**: Start/stop telemetry capture
- **Pause Button**: Temporarily pause capture without ending session
- Events are only captured when the session is active and recording is enabled

## API Integration

### Authentication Flow

1. User registers or logs in via `/auth/register` or `/auth/login`
2. Backend returns JWT token and session ID
3. Token is stored and used for subsequent authenticated requests
4. Session ID is used to associate telemetry events

### Telemetry Submission

- Events are sent to `POST /telemetry` endpoint
- Each event includes:
  - `eventType`: Type of event (keydown, mouse_move, etc.)
  - `payload`: Event-specific data
- Events are sent with Bearer token authentication
- Optimistic UI updates before server confirmation

### Dataset Generation

- Request dataset via `GET /telemetry/dataset`
- Returns comprehensive session data including:
  - Session ID
  - Generation timestamp
  - Event summary statistics
  - Full event list

### Session, Feature, and Risk Flow

- Load stored telemetry with `GET /telemetry`
- End the active session with `PATCH /sessions/current/end`
- Load session history with `GET /sessions/history`
- Generate features with `POST /features/generate`
- Retrieve features with `GET /features`
- Calculate risk with `POST /risk/calculate`
- Retrieve risk history with `GET /risk`

### Error Handling

- Network errors are caught and displayed in the status panel
- Failed events are handled gracefully
- User is informed of any connectivity issues

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint and fix issues |

### Code Style

The project uses:
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** (via ESLint) for formatting
- **Tailwind CSS** for styling

### Development Tips

1. **Hot Reload**: Changes to components automatically refresh the page
2. **Type Safety**: TypeScript helps catch errors during development
3. **Component Structure**: All components are defined in `page.tsx` for this single-page application
4. **State Management**: Uses React hooks (useState, useMemo) for state management

## Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

**Note:** If you encounter a "Bus error" during build, this is typically a system-level issue (memory/hardware). Try:
- Increasing available system memory
- Closing other applications
- Using a machine with more RAM
- Building with reduced memory usage:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

### Deployment Options

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Docker
Create a Dockerfile:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

#### Static Export
```bash
npm run build
# Output in .next directory, deploy to any static host
```

### Environment Configuration

Set environment variables in your deployment platform:
- `NEXT_PUBLIC_API_URL`: Your production API endpoint

### Performance Considerations

- **Bundle Size**: Next.js automatically code-splits and optimizes bundles
- **Images**: Use Next.js Image component for optimization (if images are added)
- **Caching**: Leverage browser caching for static assets
- **CDN**: Use a CDN for static assets in production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

UNLICENSED - All rights reserved

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
# daptive-fraud-framework-frontend
