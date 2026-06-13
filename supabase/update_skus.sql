-- Run this in Supabase SQL Editor to update all SKUs based on category
-- This uses a window function to generate sequential SKUs per category

WITH category_prefixes AS (
  SELECT unnest(ARRAY['Electronics','Furniture','Clothing','Services','Vehicles','Home & Garden','Books','Sports','Health & Beauty','Food','Drinks','Snacks','Bakery','Others']) as cat,
         unnest(ARRAY['ELEC','FURN','CLTH','SERV','VEHI','HOME','BOOK','SPRT','BEAU','FOOD','DRNK','SNCK','BAKE','OTHR']) as prefix
),
numbered AS (
  SELECT l.id, l.title, l.category, l.sku as old_sku,
         cp.prefix || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY l.category ORDER BY l.id)::text, 3, '0') as new_sku
  FROM listings l
  LEFT JOIN category_prefixes cp ON l.category = cp.cat
)
UPDATE listings SET sku = numbered.new_sku
FROM numbered WHERE listings.id = numbered.id;

-- Also fix mis-categorized products
UPDATE listings SET category = 'Others' WHERE id = 14;  -- PVC suitcase
UPDATE listings SET category = 'Clothing' WHERE id = 18; -- denim jeans
UPDATE listings SET category = 'Clothing' WHERE id = 20; -- summer dress
UPDATE listings SET category = 'Furniture' WHERE id = 22; -- TV stand
UPDATE listings SET category = 'Food' WHERE id = 36; -- Biryani rice
UPDATE listings SET category = 'Food' WHERE id = 37; -- Basmati rice

-- After fixing categories, re-run the SKU update
WITH category_prefixes AS (
  SELECT unnest(ARRAY['Electronics','Furniture','Clothing','Services','Vehicles','Home & Garden','Books','Sports','Health & Beauty','Food','Drinks','Snacks','Bakery','Others']) as cat,
         unnest(ARRAY['ELEC','FURN','CLTH','SERV','VEHI','HOME','BOOK','SPRT','BEAU','FOOD','DRNK','SNCK','BAKE','OTHR']) as prefix
),
numbered AS (
  SELECT l.id, l.title, l.category, l.sku as old_sku,
         cp.prefix || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY l.category ORDER BY l.id)::text, 3, '0') as new_sku
  FROM listings l
  LEFT JOIN category_prefixes cp ON l.category = cp.cat
)
UPDATE listings SET sku = numbered.new_sku
FROM numbered WHERE listings.id = numbered.id;
