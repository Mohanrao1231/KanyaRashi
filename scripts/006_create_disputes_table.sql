-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  tracking_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('damage', 'missing', 'delay', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT,
  evidence_photos TEXT[], -- Array of IPFS hashes
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for disputes table
CREATE POLICY "Users can view disputes for packages they're involved with" ON public.disputes
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id = disputes.package_id AND (
        p.sender_id = auth.uid() OR 
        p.recipient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.custody_transfers ct 
          WHERE ct.package_id = p.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can create disputes for packages they're involved with" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.packages p 
      WHERE p.id = disputes.package_id AND (
        p.sender_id = auth.uid() OR 
        p.recipient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.custody_transfers ct 
          WHERE ct.package_id = p.id AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Admins and dispute creators can update disputes" ON public.disputes
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_package_id ON public.disputes(package_id);
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_type ON public.disputes(type);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON public.disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_tracking_number ON public.disputes(tracking_number);

-- Insert some sample disputes for testing
INSERT INTO public.disputes (package_id, user_id, tracking_number, type, priority, status, title, description, evidence_photos) 
SELECT 
  p.id,
  p.sender_id,
  p.tracking_number,
  'damage',
  'high',
  'open',
  'Package arrived damaged',
  'The package arrived with visible damage to the outer packaging and contents appear to be affected.',
  ARRAY['QmSampleHash1', 'QmSampleHash2']
FROM public.packages p 
WHERE p.tracking_number LIKE 'TL%' 
LIMIT 1;

INSERT INTO public.disputes (package_id, user_id, tracking_number, type, priority, status, title, description) 
SELECT 
  p.id,
  p.recipient_id,
  p.tracking_number,
  'delay',
  'medium',
  'investigating',
  'Package delivery delayed',
  'Package was supposed to be delivered yesterday but has not arrived yet.'
FROM public.packages p 
WHERE p.tracking_number LIKE 'TL%' 
LIMIT 1 OFFSET 1;
