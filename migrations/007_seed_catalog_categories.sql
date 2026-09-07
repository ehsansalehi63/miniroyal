-- Seed the storefront taxonomy so category selection and menus are populated.
-- Existing rows are preserved; duplicate slugs are ignored.

INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) VALUES
(NULL, 'پسرانه', 'pesaraneh', 'انواع تیشرت، شلوار، کاپشن و ست‌های جذاب پسرانه', '🧢', 1, 1),
(NULL, 'دخترانه', 'dokhtaraneh', 'پیراهن، سارافون، بلوز و دامن‌های شیک دخترانه', '🎀', 2, 1),
(NULL, 'نوزاد', 'nozad', 'بادی، سرهمی و ست‌های نرم نخ‌پنبه برای نوزادان', '🍼', 3, 1),
(NULL, 'لباس مدرسه', 'madreseh', 'فرم‌های شیک و راحت مدرسه', '🎒', 4, 1),
(NULL, 'لباس مجلسی', 'majlesi', 'لباس‌های مجلسی کودک و نوجوان', '✨', 5, 1),
(NULL, 'ست‌ها و باکس‌ها', 'set', 'ست کامل لباس و باکس‌های هدیه', '🧸', 6, 1);

INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active)
SELECT id, 'لباس نوزادی', 'lebas-nozadi', 'انتخابی از لباس نوزادی', '🍼', 10, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'سرهمی نوزاد', 'sarhami-nozad', 'انتخابی از سرهمی نوزاد', '🧸', 11, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'بادی و لباس زیر نوزاد', 'bodi-nozad', 'انتخابی از بادی نوزاد', '🤍', 12, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'ست بیمارستانی و سیسمونی', 'set-bimarestani', 'ست‌های بیمارستانی و سیسمونی', '🧺', 13, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'کلاه، پیشبند و دستکش نوزاد', 'kolah-pishband-nozad', 'اکسسوری کاربردی نوزاد', '🧢', 14, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس دخترانه', 'lebas-dokhtaraneh', 'انتخابی از لباس دخترانه', '🎀', 20, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'پیراهن و سارافون دخترانه', 'pirahan-dokhtaraneh', 'پیراهن و سارافون دخترانه', '👗', 21, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'بلوز و شومیز دخترانه', 'bluz-dokhtaraneh', 'بلوز و شومیز دخترانه', '🌸', 22, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'دامن و شلوار دخترانه', 'daman-shalvar-dokhtaraneh', 'دامن و شلوار دخترانه', '🩰', 23, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس مجلسی دخترانه', 'majlesi-dokhtaraneh', 'لباس مجلسی دخترانه', '✨', 24, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس پسرانه', 'lebas-pesaraneh', 'انتخابی از لباس پسرانه', '🧢', 30, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'تیشرت و پولوشرت پسرانه', 'tshirt-pesaraneh', 'تیشرت و پولوشرت پسرانه', '👕', 31, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'پیراهن پسرانه', 'pirahan-pesaraneh', 'پیراهن پسرانه', '🧥', 32, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'شلوار و شلوارک پسرانه', 'shalvar-pesaraneh', 'شلوار و شلوارک پسرانه', '👖', 33, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'هودی، سویشرت و ژاکت کودک', 'hoodie-sweatshirt', 'هودی و سویشرت کودک', '🧶', 34, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'کاپشن و پالتو کودک', 'kapshan-palto-koodak', 'کاپشن و پالتو کودک', '🧣', 40, 1 FROM categories WHERE slug = 'madreseh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس فرم و مدرسه', 'lebas-madreseh', 'لباس فرم و مدرسه', '🎒', 41, 1 FROM categories WHERE slug = 'madreseh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس ورزشی کودک و نوجوان', 'lebas-varzeshi', 'لباس ورزشی کودک و نوجوان', '⚽', 50, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'ست لباس کودک و نوجوان', 'set-lebas-koodak', 'ست لباس کودک و نوجوان', '🧩', 51, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس نوجوان دخترانه', 'lebas-nojavanan-dokhtar', 'لباس نوجوان دخترانه', '💜', 25, 1 FROM categories WHERE slug = 'dokhtaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'لباس نوجوان پسرانه', 'lebas-nojavanan-pesar', 'لباس نوجوان پسرانه', '💙', 35, 1 FROM categories WHERE slug = 'pesaraneh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'کفش و کتانی کودک', 'kafsh-koodak', 'کفش و کتانی کودک', '👟', 52, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'جوراب و پاپوش کودک', 'jorab-papush', 'جوراب و پاپوش کودک', '🧦', 15, 1 FROM categories WHERE slug = 'nozad';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'کیف و کوله‌پشتی کودک', 'kif-koodak', 'کیف و کوله‌پشتی کودک', '🎒', 42, 1 FROM categories WHERE slug = 'madreseh';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'کلاه و اکسسوری مو', 'kolah-aksessori-mo', 'کلاه و اکسسوری مو', '🎀', 53, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'عینک آفتابی کودک', 'eynak-aftabi-koodak', 'عینک آفتابی کودک', '🕶️', 54, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'زیورآلات و اکسسوری فانتزی', 'zivar-aksessori-fantasy', 'زیورآلات و اکسسوری فانتزی', '⭐', 55, 1 FROM categories WHERE slug = 'set';
INSERT IGNORE INTO categories (parent_id, name, slug, description, icon, sort_order, is_active) SELECT id, 'اکسسوری نوزاد', 'aksessori-nozad', 'اکسسوری نوزاد', '🧸', 16, 1 FROM categories WHERE slug = 'nozad';
