-- Update any existing currency references to Indian Rupees
-- This script ensures all monetary values are treated as INR

-- Add a comment to the packages table value column to indicate INR
COMMENT ON COLUMN public.packages.value IS 'Package declared value in Indian Rupees (INR)';

-- Create a function to format currency as INR
CREATE OR REPLACE FUNCTION format_inr_currency(amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
  RETURN '₹' || TO_CHAR(amount, 'FM999,999,999.00');
END;
$$ LANGUAGE plpgsql;

-- Create a view for package values in formatted INR
CREATE OR REPLACE VIEW package_values_inr AS
SELECT 
  id,
  tracking_number,
  title,
  format_inr_currency(value) as formatted_value,
  value as raw_value
FROM public.packages
WHERE value IS NOT NULL;
