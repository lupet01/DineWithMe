-- Manual Admin User Creation
-- Use this if the automatic sync isn't working

-- First, check if user exists
SELECT id, email, role FROM users WHERE email = 'luupetros@gmail.com';

-- If no user exists, insert manually (replace with your Clerk user ID)
-- You can find your Clerk user ID in the Clerk dashboard or browser dev tools
INSERT INTO users (
  id,
  "authProviderId",
  email,
  "firstName",
  "lastName",
  role,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  'clxyz123456789',  -- Replace with a CUID
  'user_clerk_id_here',  -- Replace with your Clerk user ID
  'luupetros@gmail.com',
  'Luthando',
  'Petros',
  'RESTAURANT_ADMIN',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT ("authProviderId") DO UPDATE SET
  role = 'RESTAURANT_ADMIN',
  "updatedAt" = NOW();

-- Verify the user was created/updated
SELECT id, email, role, "firstName", "lastName" FROM users WHERE email = 'luupetros@gmail.com';
