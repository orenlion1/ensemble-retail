CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'mens',
  category TEXT NOT NULL,
  original_price NUMERIC(10,2),
  price NUMERIC(10,2) NOT NULL,
  colors TEXT NOT NULL,
  sizes TEXT NOT NULL,
  badge TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  stock INTEGER NOT NULL,
  image TEXT NOT NULL
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'mens';
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
