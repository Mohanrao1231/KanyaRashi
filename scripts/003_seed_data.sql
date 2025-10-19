-- Insert sample users (these will be created when users sign up)
-- This is just for reference - actual users are created via auth.users

-- Insert sample packages for testing
INSERT INTO public.packages (
  tracking_number,
  sender_id,
  recipient_id,
  title,
  description,
  weight,
  dimensions,
  value,
  fragile,
  priority,
  pickup_address,
  delivery_address,
  status
) VALUES 
-- Note: Replace these UUIDs with actual user IDs after user registration
-- This is sample data structure for reference
('TP12345678', 
 '00000000-0000-0000-0000-000000000001'::uuid,
 '00000000-0000-0000-0000-000000000002'::uuid,
 'Important Documents',
 'Legal contracts and certificates',
 0.5,
 '{"length": 30, "width": 20, "height": 2}',
 1000.00,
 true,
 'express',
 '123 Main St, New York, NY 10001',
 '456 Oak Ave, Los Angeles, CA 90210',
 'created'
);

-- Insert sample notification templates
-- These will be used by the application to create notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.notification_templates (template_key, title_template, message_template, type) VALUES
('package_created', 'Package Created', 'Your package {{tracking_number}} has been created and is ready for pickup.', 'success'),
('package_picked_up', 'Package Picked Up', 'Your package {{tracking_number}} has been picked up by {{courier_name}}.', 'info'),
('package_in_transit', 'Package In Transit', 'Your package {{tracking_number}} is on its way to the destination.', 'info'),
('package_delivered', 'Package Delivered', 'Your package {{tracking_number}} has been successfully delivered.', 'success'),
('custody_transfer', 'Custody Transfer', 'Package {{tracking_number}} custody has been transferred to {{new_custodian}}.', 'info'),
('delivery_delayed', 'Delivery Delayed', 'Your package {{tracking_number}} delivery has been delayed. New expected delivery: {{new_date}}.', 'warning'),
('package_damaged', 'Package Damage Reported', 'Damage has been reported for package {{tracking_number}}. Please contact support.', 'error');
