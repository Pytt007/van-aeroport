-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    pickup_address TEXT,
    destination TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    return_date DATE,
    return_time TIME,
    travelers INTEGER DEFAULT 1,
    total_price NUMERIC,
    booking_type TEXT, -- 'airport', 'hourly', 'rental'
    status TEXT DEFAULT 'envoyée' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create addresses table
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT DEFAULT 'other' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookings Policies
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- Addresses Policies
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'T-Series', 'Kicks', etc.
    image_url TEXT NOT NULL,
    rating NUMERIC DEFAULT 4.5,
    speed TEXT,
    seats TEXT,
    engine TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policies for vehicles (anyone can view, only admins can modify via dashboard)
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);

-- Insert initial fleet
INSERT INTO public.vehicles (name, category, image_url, rating, speed, seats, engine)
VALUES 
('Bestune T55', 'T-Series', 'https://votre-bucket.supabase.co/storage/v1/object/public/vehicles/taxi-sedan.png', 4.8, '190 km/h', '5 Places', '1.5L Turbo'),
('Bestune T77', 'T-Series', 'https://votre-bucket.supabase.co/storage/v1/object/public/vehicles/taxi-suv.png', 4.9, '192 km/h', '5 Places', '1.5L Turbo'),
('Nissan Kicks', 'Kicks', 'https://votre-bucket.supabase.co/storage/v1/object/public/vehicles/taxi-van.png', 4.7, '180 km/h', '5 Places', '1.6L Essence');

-- App Settings for global constants
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pricing Zones (Inter-commune)
CREATE TABLE public.zone_pricing (
    zone_letter TEXT PRIMARY KEY,
    price NUMERIC NOT NULL
);

-- Communes (Locations and their specific pricing)
CREATE TABLE public.communes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    zone_letter TEXT REFERENCES public.zone_pricing(zone_letter),
    airport_price NUMERIC, -- Specific price to/from airport
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view zone pricing" ON public.zone_pricing FOR SELECT USING (true);
CREATE POLICY "Anyone can view communes" ON public.communes FOR SELECT USING (true);

-- Initial Data
INSERT INTO public.app_settings (key, value, description)
VALUES 
('whatsapp_config', '{"number": "2250700000000", "message_template": "Bonjour, je souhaite réserver..."}'::jsonb, 'Configuration WhatsApp'),
('airport_config', '{"hub_name": "Aéroport Félix Houphouët-Boigny"}'::jsonb, 'Configuration Aéroport'),
('hourly_pricing', '{"t_series": {"first_hour": 15000, "additional_hour": 7000}, "kicks": {"first_hour": 10000, "additional_hour": 7000}}'::jsonb, 'Tarifiction à l''heure'),
('rental_pricing', '{"t_series": {"abidjan": {"base": 45000, "long_term": 40000}, "interior": {"base": 50000, "long_term": 45000, "high_km": 60000}}, "kicks": {"abidjan": {"base": 35000, "long_term": 30000}, "interior": {"base": 40000, "long_term": 35000, "high_km": 45000}}}'::jsonb, 'Tarification location');

INSERT INTO public.zone_pricing (zone_letter, price)
VALUES 
('A', 8000),
('B', 12000),
('C', 15000),
('D', 20000);

INSERT INTO public.communes (name, zone_letter, airport_price, display_order)
VALUES 
('Aéroport Félix Houphouët-Boigny', null, 0, 1),
('Abobo', 'C', 15000, 2),
('Adjamé', 'B', 15000, 3),
('Attécoubé', 'B', 15000, 4),
('Anyama', 'D', 20000, 5),
('Bassam', 'C', 20000, 6),
('Bingerville', 'D', 20000, 7),
('Cocody', 'A', 10000, 8),
('Koumassi', 'A', 7500, 9),
('Marcory', 'A', 7500, 10),
('Plateau', 'A', 10000, 11),
('Port-Bouët', 'A', 7500, 12),
('Songon', 'D', 20000, 13),
('Treichville', 'A', 10000, 14),
('Yopougon', 'C', 15000, 15);

-- New function for deleting account
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
