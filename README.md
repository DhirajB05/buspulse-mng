# BusPulse Mangalore - Smart Transit

Real-time bus tracking and AI-powered fleet management for Mangalore.

## Features
- **Live Tracking:** Real-time bus movements via Supabase & Mapbox.
- **AI Analytics:** Fleet optimization using Gemini AI.
- **Driver Mode:** Broadcast live GPS from your phone.
- **SOS:** Instant emergency alerts.

## Setup Instructions
1. **Clone the repo:** `git clone <your-repo-link>`
2. **Install dependencies:** `npm install`
3. **Set up Environment Variables:** Create a `.env` file with your Supabase and Mapbox keys.
4. **Run locally:** `npm start`
5. **Deploy:** Push to GitHub and connect to Vercel.

## Supabase SQL Setup
Run the following in your Supabase SQL Editor:
```sql
CREATE TABLE live_fleet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_no TEXT,
  lat FLOAT,
  lng FLOAT,
  crowd_level TEXT,
  last_stop TEXT
);
ALTER PUBLICATION supabase_realtime ADD TABLE live_fleet;