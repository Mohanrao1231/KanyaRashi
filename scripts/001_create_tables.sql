-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('sender', 'courier', 'recipient', 'admin')) DEFAULT 'sender',
  phone TEXT,
  address TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  recipient_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  weight DECIMAL(10,2),
  dimensions TEXT, -- JSON string: {"length": 10, "width": 5, "height": 3}
  value DECIMAL(12,2),
  fragile BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('standard', 'express', 'overnight')) DEFAULT 'standard',
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_date TIMESTAMP WITH TIME ZONE,
  expected_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('created', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'created',
  blockchain_hash TEXT, -- Transaction hash on Polygon
  ipfs_hash TEXT, -- IPFS hash for package photos/documents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custody_transfers table
CREATE TABLE IF NOT EXISTS public.custody_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id),
  to_user_id UUID NOT NULL REFERENCES public.users(id),
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('pickup', 'handoff', 'delivery')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  photo_hash TEXT, -- IPFS hash for transfer photo
  signature_hash TEXT, -- IPFS hash for digital signature
  blockchain_hash TEXT, -- Transaction hash on Polygon
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  ai_verification_score DECIMAL(3,2) -- 0.00 to 1.00 confidence score
);

-- Create package_photos table
CREATE TABLE IF NOT EXISTS public.package_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  photo_hash TEXT NOT NULL, -- IPFS hash
  photo_type TEXT NOT NULL CHECK (photo_type IN ('initial', 'pickup', 'transit', 'delivery', 'damage')),
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  ai_analysis TEXT, -- JSON string with AI analysis results
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  package_id UUID REFERENCES public.packages(id),
  action TEXT NOT NULL,
  details TEXT, -- JSON string with action details
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for packages table
CREATE POLICY "Users can view packages they're involved with" ON public.packages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM public.custody_transfers ct 
      WHERE ct.package_id = packages.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
    )
  );

CREATE POLICY "Senders can create packages" ON public.packages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Package participants can update packages" ON public.packages
  FOR UPDATE USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM public.custody_transfers ct 
      WHERE ct.package_id = packages.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
    )
  );

-- Create RLS policies for custody_transfers table
CREATE POLICY "Users can view transfers they're involved with" ON public.custody_transfers
  FOR SELECT USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id = custody_transfers.package_id AND (p.sender_id = auth.uid() OR p.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can create transfers they're involved with" ON public.custody_transfers
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

-- Create RLS policies for package_photos table
CREATE POLICY "Users can view photos for packages they're involved with" ON public.package_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id = package_photos.package_id AND (
        p.sender_id = auth.uid() OR 
        p.recipient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.custody_transfers ct 
          WHERE ct.package_id = p.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can upload photos for packages they're involved with" ON public.package_photos
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id = package_photos.package_id AND (
        p.sender_id = auth.uid() OR 
        p.recipient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.custody_transfers ct 
          WHERE ct.package_id = p.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
        )
      )
    )
  );

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for audit_logs table
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_sender_id ON public.packages(sender_id);
CREATE INDEX IF NOT EXISTS idx_packages_recipient_id ON public.packages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON public.packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_package_id ON public.custody_transfers(package_id);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_from_user_id ON public.custody_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_to_user_id ON public.custody_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_package_photos_package_id ON public.package_photos(package_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_package_id ON public.audit_logs(package_id);
