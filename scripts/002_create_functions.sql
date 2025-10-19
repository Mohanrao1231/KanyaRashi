-- Function to generate unique tracking numbers
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
  tracking_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate tracking number: TP + 8 random uppercase letters/numbers
    tracking_num := 'TP' || upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.packages 
    WHERE tracking_number = tracking_num;
    
    -- If unique, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN tracking_num;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set tracking number on package creation
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, package_id, action, details)
  VALUES (
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    row_to_json(COALESCE(NEW, OLD))::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS set_tracking_number_trigger ON public.packages;
CREATE TRIGGER set_tracking_number_trigger
  BEFORE INSERT ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_number();

DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS packages_audit_trigger ON public.packages;
CREATE TRIGGER packages_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS custody_transfers_audit_trigger ON public.custody_transfers;
CREATE TRIGGER custody_transfers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.custody_transfers
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
