-- Supabase Database Schema for Mentor Connect Application

-- Create user_profiles table
create table if not exists public.user_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade unique not null,
    name text not null,
    email text not null,
    role text not null check (role in ('mentor', 'mentee')),
    current_role text,
    phone text,
    department text,
    position text,
    bio text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security after tables are created
alter table public.user_profiles enable row level security;
alter table public.mentee_profiles enable row level security;
alter table public.mentoring_sessions enable row level security;
alter table public.academic_records enable row level security;
alter table public.internship_records enable row level security;

-- Add constraints after table creation
alter table public.user_profiles add constraint current_role_check check (current_role in ('mentor', 'mentee') or current_role is null);

-- Create mentee_profiles table
create table if not exists public.mentee_profiles (
    id uuid primary key default gen_random_uuid(),
    mentor_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    email text not null,
    student_id text not null,
    phone text,
    department text not null,
    year text not null,
    gpa decimal(3,2),
    goals text,
    status text default 'active' check (status in ('active', 'inactive', 'graduated')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create mentoring_sessions table
create table if not exists public.mentoring_sessions (
    id uuid primary key default gen_random_uuid(),
    mentor_id uuid references auth.users(id) on delete cascade not null,
    mentee uuid references public.mentee_profiles(id) on delete cascade not null,
    session_date date not null,
    duration integer, -- in minutes
    session_type text not null check (session_type in (
        'academic_guidance', 'career_counseling', 'project_review', 
        'internship_prep', 'exam_preparation', 'personal_development', 'other'
    )),
    status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
    topics_discussed text,
    action_items text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create academic_records table
create table if not exists public.academic_records (
    id uuid primary key default gen_random_uuid(),
    mentee_id uuid references public.mentee_profiles(id) on delete cascade not null,
    mentor_id uuid references auth.users(id) on delete cascade not null,
    semester text not null,
    year text not null,
    course_name text not null,
    course_code text,
    credits integer,
    grade text,
    gpa decimal(3,2),
    remarks text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create internship_records table
create table if not exists public.internship_records (
    id uuid primary key default gen_random_uuid(),
    mentee_id uuid references public.mentee_profiles(id) on delete cascade not null,
    mentor_id uuid references auth.users(id) on delete cascade not null,
    company_name text not null,
    position text not null,
    start_date date,
    end_date date,
    status text default 'applied' check (status in ('applied', 'interviewed', 'accepted', 'rejected', 'completed')),
    description text,
    skills_gained text,
    feedback text,
    stipend decimal(10,2),
    location text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Row Level Security Policies

-- User profiles: Users can only see and edit their own profile
create policy "Users can view own profile" on public.user_profiles
    for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.user_profiles
    for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on public.user_profiles
    for update using (auth.uid() = user_id);

-- Mentee profiles: Mentors can only see and edit their own mentees
create policy "Mentors can view own mentees" on public.mentee_profiles
    for select using (auth.uid() = mentor_id);

create policy "Mentors can insert mentees" on public.mentee_profiles
    for insert with check (auth.uid() = mentor_id);

create policy "Mentors can update own mentees" on public.mentee_profiles
    for update using (auth.uid() = mentor_id);

create policy "Mentors can delete own mentees" on public.mentee_profiles
    for delete using (auth.uid() = mentor_id);

-- Mentoring sessions: Mentors can only see and edit their own sessions
create policy "Mentors can view own sessions" on public.mentoring_sessions
    for select using (auth.uid() = mentor_id);

create policy "Mentors can insert sessions" on public.mentoring_sessions
    for insert with check (auth.uid() = mentor_id);

create policy "Mentors can update own sessions" on public.mentoring_sessions
    for update using (auth.uid() = mentor_id);

create policy "Mentors can delete own sessions" on public.mentoring_sessions
    for delete using (auth.uid() = mentor_id);

-- Academic records: Mentors can only see and edit records for their mentees
create policy "Mentors can view mentee academic records" on public.academic_records
    for select using (auth.uid() = mentor_id);

create policy "Mentors can insert academic records" on public.academic_records
    for insert with check (auth.uid() = mentor_id);

create policy "Mentors can update academic records" on public.academic_records
    for update using (auth.uid() = mentor_id);

create policy "Mentors can delete academic records" on public.academic_records
    for delete using (auth.uid() = mentor_id);

-- Internship records: Mentors can only see and edit records for their mentees
create policy "Mentors can view mentee internship records" on public.internship_records
    for select using (auth.uid() = mentor_id);

create policy "Mentors can insert internship records" on public.internship_records
    for insert with check (auth.uid() = mentor_id);

create policy "Mentors can update internship records" on public.internship_records
    for update using (auth.uid() = mentor_id);

create policy "Mentors can delete internship records" on public.internship_records
    for delete using (auth.uid() = mentor_id);

-- Create indexes for better performance
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists mentee_profiles_mentor_id_idx on public.mentee_profiles(mentor_id);
create index if not exists mentoring_sessions_mentor_id_idx on public.mentoring_sessions(mentor_id);
create index if not exists mentoring_sessions_mentee_idx on public.mentoring_sessions(mentee);
create index if not exists academic_records_mentee_id_idx on public.academic_records(mentee_id);
create index if not exists academic_records_mentor_id_idx on public.academic_records(mentor_id);
create index if not exists internship_records_mentee_id_idx on public.internship_records(mentee_id);
create index if not exists internship_records_mentor_id_idx on public.internship_records(mentor_id);

-- Function to automatically update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger user_profiles_updated_at before update on public.user_profiles
    for each row execute function public.handle_updated_at();

create trigger mentee_profiles_updated_at before update on public.mentee_profiles
    for each row execute function public.handle_updated_at();

create trigger mentoring_sessions_updated_at before update on public.mentoring_sessions
    for each row execute function public.handle_updated_at();

create trigger academic_records_updated_at before update on public.academic_records
    for each row execute function public.handle_updated_at();

create trigger internship_records_updated_at before update on public.internship_records
    for each row execute function public.handle_updated_at();
