
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view notes" ON public.notes FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view images" ON public.course_images FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view links" ON public.course_links FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view announcements" ON public.announcements FOR SELECT TO anon USING (true);

CREATE POLICY "Any authenticated user can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Any authenticated user can view notes" ON public.notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Any authenticated user can view images" ON public.course_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Any authenticated user can view links" ON public.course_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Any authenticated user can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.notes TO anon;
GRANT SELECT ON public.course_images TO anon;
GRANT SELECT ON public.course_links TO anon;
GRANT SELECT ON public.announcements TO anon;
