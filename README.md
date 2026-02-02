# Charge Recorder

A minimalist web app for tracking electric car charge levels via voice or text input.

![Charge Recorder App](https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/f77305c6-c0d3-492c-8466-ebac82751615/chargerecorder.PNG?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1770055858&Signature=d0s1Jdtf4cRcAmlTrGCB7PluaJM=)

## Features

- **Voice Input** - Tap the mic and say "75 percent" to record your charge level
- **Text Input** - Manual entry with Start/Stop buttons
- **Session History** - View all charging sessions with gain calculation
- **CSV Export** - Download your data for analysis
- **Mobile-First** - Optimized for iPhone Safari and Android Chrome

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Neon PostgreSQL
- **Hosting:** Vercel
- **Voice:** Web Speech API (browser-native, no server processing)

## How It Works

1. **Unlock** the app with your passphrase
2. **Start Charging** - Tap mic and say "50 percent" (or type manually)
3. **Stop Charging** - Tap mic and say "85 percent" (end must be ≥ start)
4. **View History** - See all sessions with calculated gains
5. **Export** - Download CSV for your records

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your NEON_DATABASE_URL and UNLOCK_PHRASE

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Deployment

The app is deployed at [chargerecorder.vercel.app](https://chargerecorder.vercel.app)

Environment variables required:
- `NEON_DATABASE_URL` - PostgreSQL connection string
- `UNLOCK_PHRASE` - Your secret passphrase

## License

MIT

---

Made with ❤️ by [Richard Wimmer](https://richardwimmer.de)
