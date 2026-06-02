
create policy "Approved users read course images"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-images' and public.is_approved(auth.uid()));
