GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories, public.menu_items TO anon, authenticated;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passwordless menu category management" ON public.menu_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Passwordless menu item management" ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
COMMENT ON POLICY "Passwordless menu category management" ON public.menu_categories IS 'Owner-requested public passwordless menu management; anyone can create, edit and delete categories.';
COMMENT ON POLICY "Passwordless menu item management" ON public.menu_items IS 'Owner-requested public passwordless menu management; hidden items remain readable by the management panel.';