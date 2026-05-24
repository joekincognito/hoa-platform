-- Generic seed for hoa-platform (no real HOA data).
-- Forks should replace this file with HOA-specific seed data.

insert into announcements (title, body, is_active, display_order) values
  ('Welcome', 'This is a placeholder announcement. Replace it with one relevant to your HOA from /admin/announcements.', true, 1);

insert into board_members (name, role, display_order) values
  ('Board Member One', 'President', 1),
  ('Board Member Two', 'Treasurer', 2),
  ('Board Member Three', 'Secretary', 3);
