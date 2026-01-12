-- 1. TABLES SETUP
-- Create Live Fleet Table (Bus Tracking)
CREATE TABLE public.live_fleet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_no TEXT NOT NULL,
    lat FLOAT8 NOT NULL,
    lng FLOAT8 NOT NULL,
    crowd_level TEXT DEFAULT 'Low' CHECK (crowd_level IN ('Low', 'Medium', 'High')),
    last_stop TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Crowd Reports Table
CREATE TABLE public.crowd_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_no TEXT,
    level TEXT,
    lat FLOAT8,
    lng FLOAT8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SOS Alerts Table
CREATE TABLE public.sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES live_fleet(id),
    status TEXT DEFAULT 'ACTIVE',
    lat FLOAT8,
    lng FLOAT8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE REALTIME
-- This allows the React app to see bus movements instantly
ALTER PUBLICATION supabase_realtime ADD TABLE live_fleet;
ALTER PUBLICATION supabase_realtime ADD TABLE crowd_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;

-- 3. SECURITY POLICIES (RLS)
-- Enable Row Level Security
ALTER TABLE live_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Create "Public" policies (Allows anyone to read/write for MVP testing)
CREATE POLICY "Allow public read access" ON live_fleet FOR SELECT USING (true);
CREATE POLICY "Allow public update access" ON live_fleet FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access" ON crowd_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON sos_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access" ON sos_alerts FOR SELECT USING (true);

-- 4. SAMPLE DATA
INSERT INTO live_fleet (route_no, lat, lng, last_stop, crowd_level)
VALUES 
('15', 12.8654, 74.8427, 'State Bank', 'Low'),
('27', 12.9141, 74.8560, 'Jyothi Circle', 'Medium');