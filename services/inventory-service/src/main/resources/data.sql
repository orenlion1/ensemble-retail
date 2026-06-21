DELETE FROM products;

INSERT INTO products (id, name, department, category, original_price, price, colors, sizes, badge, rating, stock, image) VALUES
('mens-shell-alpha', 'Men''s Alpine Shell Jacket', 'mens', 'Shells', NULL, 340.00, 'Graphite,Lichen,Signal Red', 'XS,S,M,L,XL', 'Storm ready', 4.8, 42, 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=900&q=80'),
('mens-midlayer-grid', 'Men''s Grid Fleece Midlayer', 'mens', 'Mid Layers', 128.00, 109.00, 'Pine,Black,Ice', 'S,M,L,XL', '15% off', 4.7, 65, 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80'),
('mens-trail-pant', 'Men''s Traverse Trail Pant', 'mens', 'Pants', 156.00, 133.00, 'Basalt,Moss', '28,30,32,34,36', '15% off', 4.9, 38, 'https://images.unsplash.com/photo-1617612283917-5268a9d94651?auto=format&fit=crop&w=900&q=80'),
('mens-daypack-22', 'Men''s Route 22 Pack', 'mens', 'Packs', NULL, 118.00, 'Black,Cobalt,Clay', '22L', 'Online exclusive', 4.6, 51, 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=900&q=80'),
('womens-base-merino', 'Women''s Merino Base Crew', 'womens', 'Base Layers', NULL, 88.00, 'Heather,Night,Sage', 'XS,S,M,L,XL', 'Warmth without bulk', 4.5, 72, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
('womens-softshell-hoody', 'Women''s Softshell Hoody', 'womens', 'Shells', 220.00, 187.00, 'Mineral,Black,Juniper', 'XS,S,M,L,XL', '15% off', 4.7, 58, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
('womens-climb-pant', 'Women''s Climb Pant', 'womens', 'Pants', NULL, 148.00, 'Black,Sage', '0,2,4,6,8,10,12', 'Articulated fit', 4.8, 44, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80'),
('womens-rain-cap', 'Women''s Rainline Cap', 'womens', 'Accessories', 44.00, 37.00, 'Black,Olive', 'One Size', '15% off', 4.4, 89, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80');
