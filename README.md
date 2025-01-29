# TickTick Mobile Web Client

A mobile-optimized web client for TickTick with natural language task management capabilities.

## Features

- Mobile-first design optimized for touch interactions
- Natural language processing for task creation and management
- Real-time synchronization with TickTick
- OAuth integration with TickTick API
- Offline support through PWA

## Tech Stack

- Next.js 14.1.0
- TypeScript
- Tailwind CSS
- React Query
- NextAuth.js

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with:

```
TICKTICK_CLIENT_ID=your_client_id
TICKTICK_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
OPENROUTER_API_KEY=your_api_key
```

## Project Structure

```
/src
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utilities and API clients
└── types/           # TypeScript type definitions
