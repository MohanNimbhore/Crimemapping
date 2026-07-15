-- Insert default admin user
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@pdm.com',
  'admin123',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 'John Smith', 'john.smith@pdm.com', 'officer123', 'officer', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Sarah Johnson', 'sarah.johnson@pdm.com', 'officer123', 'officer', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Mike Davis', 'mike.davis@pdm.com', 'admin123', 'admin', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Emily Brown', 'emily.brown@pdm.com', 'officer123', 'officer', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;