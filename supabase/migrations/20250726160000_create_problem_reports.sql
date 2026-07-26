create table problem_reports (
    id uuid primary key,
    created_at timestamptz not null default now(),
    resolved boolean not null default false,
    what_happened text not null,
    trying_to_do text,
    contact_email text,
    full_url text,
    current_hash text,
    current_screen text,
    user_id uuid references auth.users(id) on delete set null,
    user_agent text,
    browser_platform text,
    browser_language text,
    viewport_width integer,
    viewport_height integer,
    app_version text,
    current_set_id uuid,
    current_activity text,
    error_message text,
    error_stack text
);

create index idx_problem_reports_created_at
    on problem_reports(created_at desc);

create index idx_problem_reports_resolved
    on problem_reports(resolved, created_at desc);

alter table problem_reports enable row level security;

create policy "Allow public problem report inserts"
on problem_reports
for insert
to anon, authenticated
with check (true);

-- No SELECT/UPDATE/DELETE policies for client roles.
-- View reports with the service role key or in the Supabase dashboard.
