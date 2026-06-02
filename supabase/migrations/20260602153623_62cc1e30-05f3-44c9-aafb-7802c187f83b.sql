
-- Enums
create type public.app_role as enum ('admin', 'student');
create type public.account_status as enum ('pending', 'approved', 'rejected');
create type public.announcement_priority as enum ('normal', 'important', 'urgent');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- User roles (separate table to avoid privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- Security definer helpers
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_approved(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = _user_id and status = 'approved');
$$;

-- Profiles RLS
create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile basics" on public.profiles
  for update to authenticated using (auth.uid() = id)
  with check (auth.uid() = id and status = (select status from public.profiles where id = auth.uid()));
create policy "Admins update any profile" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- user_roles RLS
create policy "Users view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins view all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup; auto-promote primary admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  is_primary_admin boolean;
begin
  is_primary_admin := lower(new.email) = 'kxbir.o@gmail.com';

  insert into public.profiles (id, email, full_name, avatar_url, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when is_primary_admin then 'approved'::public.account_status else 'pending'::public.account_status end
  );

  if is_primary_admin then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'student')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  code text,
  description text,
  thumbnail_url text,
  accent_color text default 'violet',
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

grant select on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;

create policy "Approved users view courses" on public.courses
  for select to authenticated using (public.is_approved(auth.uid()));
create policy "Admins manage courses" on public.courses
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert on public.notes to authenticated;
grant all on public.notes to service_role;
alter table public.notes enable row level security;

create policy "Approved users view notes" on public.notes
  for select to authenticated using (public.is_approved(auth.uid()));
create policy "Admins manage notes" on public.notes
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Images
create table public.course_images (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text,
  image_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.course_images to authenticated;
grant all on public.course_images to service_role;
alter table public.course_images enable row level security;

create policy "Approved users view images" on public.course_images
  for select to authenticated using (public.is_approved(auth.uid()));
create policy "Admins manage images" on public.course_images
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Links
create table public.course_links (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  category text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.course_links to authenticated;
grant all on public.course_links to service_role;
alter table public.course_links enable row level security;

create policy "Approved users view links" on public.course_links
  for select to authenticated using (public.is_approved(auth.uid()));
create policy "Admins manage links" on public.course_links
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  message text not null,
  priority public.announcement_priority not null default 'normal',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;

create policy "Approved users view announcements" on public.announcements
  for select to authenticated using (public.is_approved(auth.uid()));
create policy "Admins manage announcements" on public.announcements
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Seed courses
insert into public.courses (title, code, description, accent_color) values
  ('Full Stack Development', 'CS-501', 'End-to-end web development with modern frameworks.', 'violet'),
  ('Database Management System', 'CS-402', 'Relational databases, SQL, normalization, and transactions.', 'sky'),
  ('Mathematical Analysis', 'MA-301', 'Limits, continuity, sequences and series.', 'emerald'),
  ('Disaster Management', 'GE-201', 'Risk assessment, mitigation and response planning.', 'amber'),
  ('Computer Organization', 'CS-302', 'CPU architecture, memory hierarchy and I/O.', 'rose'),
  ('Operating System', 'CS-401', 'Processes, scheduling, memory and file systems.', 'cyan'),
  ('Machine Learning', 'CS-601', 'Supervised, unsupervised and deep learning fundamentals.', 'fuchsia'),
  ('Advanced Java Programming', 'CS-502', 'Concurrency, Spring, JDBC and design patterns.', 'orange');

-- Storage policies
-- course-files (private): approved users read, admins write
create policy "Approved users read course files"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-files' and public.is_approved(auth.uid()));

create policy "Admins upload course files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-files' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update course files"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-files' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete course files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-files' and public.has_role(auth.uid(), 'admin'));

-- course-images (public bucket): admins write
create policy "Admins upload course images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update course images"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete course images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-images' and public.has_role(auth.uid(), 'admin'));
