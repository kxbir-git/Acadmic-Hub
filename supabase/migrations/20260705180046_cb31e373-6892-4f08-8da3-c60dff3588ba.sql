
CREATE POLICY "Public read course files" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'course-files');
CREATE POLICY "Public read course images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'course-images');
CREATE POLICY "Any authenticated read course files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-files');
CREATE POLICY "Any authenticated read course images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-images');
