-- =========================================================
-- Festorga — Migration initiale
-- Tables : festorga_events, festorga_participants, festorga_expenses
-- =========================================================

-- ---------------------------------------------------------
-- 1. Table des événements
-- ---------------------------------------------------------
create table if not exists festorga_events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,               -- code à partager pour rejoindre l'événement
  organizer_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists idx_festorga_events_organizer
  on festorga_events(organizer_id);

create index if not exists idx_festorga_events_code
  on festorga_events(code);

-- ---------------------------------------------------------
-- 2. Table des participants (lien utilisateur <-> événement)
-- ---------------------------------------------------------
create table if not exists festorga_participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references festorga_events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'participant' check (role in ('organizer', 'participant')),
  joined_at  timestamptz not null default now(),
  unique (event_id, user_id)  -- un utilisateur ne peut rejoindre qu'une fois le même événement
);

create index if not exists idx_festorga_participants_event
  on festorga_participants(event_id);

create index if not exists idx_festorga_participants_user
  on festorga_participants(user_id);

-- ---------------------------------------------------------
-- 3. Table des dépenses
-- ---------------------------------------------------------
create table if not exists festorga_expenses (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references festorga_events(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  amount       numeric(10,2) not null check (amount > 0),
  category     text not null check (category in ('nourriture', 'boissons', 'transport', 'camping', 'divers')),
  expense_date date not null default current_date,
  comment      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_festorga_expenses_event
  on festorga_expenses(event_id);

create index if not exists idx_festorga_expenses_author
  on festorga_expenses(author_id);

-- Maintien automatique de updated_at
create or replace function festorga_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_festorga_expenses_updated_at on festorga_expenses;
create trigger trg_festorga_expenses_updated_at
  before update on festorga_expenses
  for each row
  execute function festorga_set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table festorga_events enable row level security;
alter table festorga_participants enable row level security;
alter table festorga_expenses enable row level security;

-- Fonction utilitaire : l'utilisateur courant est-il participant de l'événement ?
create or replace function festorga_is_participant(p_event_id uuid)
returns boolean as $$
  select exists (
    select 1 from festorga_participants
    where event_id = p_event_id
      and user_id = auth.uid()
  );
$$ language sql stable security definer;

-- Fonction utilitaire : l'utilisateur courant est-il organisateur de l'événement ?
create or replace function festorga_is_organizer(p_event_id uuid)
returns boolean as $$
  select exists (
    select 1 from festorga_events
    where id = p_event_id
      and organizer_id = auth.uid()
  );
$$ language sql stable security definer;

-- ---------------------------------------------------------
-- Policies : festorga_events
-- ---------------------------------------------------------

-- Voir les événements auxquels on participe, ou ceux qu'on vient de créer en
-- tant qu'organisateur (nécessaire car l'insert().select() du backend relit
-- la ligne juste après l'avoir créée, avant l'ajout du participant)
create policy festorga_events_select on festorga_events
  for select
  using (festorga_is_participant(id) or organizer_id = auth.uid());

-- Tout utilisateur connecté peut créer un événement (il en devient l'organisateur)
create policy festorga_events_insert on festorga_events
  for insert
  with check (organizer_id = auth.uid());

-- Seul l'organisateur peut supprimer son événement
create policy festorga_events_delete on festorga_events
  for delete
  using (organizer_id = auth.uid());

-- ---------------------------------------------------------
-- Policies : festorga_participants
-- ---------------------------------------------------------

-- Voir la liste des participants d'un événement auquel on participe soi-même
create policy festorga_participants_select on festorga_participants
  for select
  using (festorga_is_participant(event_id));

-- Rejoindre un événement (s'ajouter soi-même) ou être invité par l'organisateur
create policy festorga_participants_insert on festorga_participants
  for insert
  with check (
    user_id = auth.uid()
    or festorga_is_organizer(event_id)
  );

-- Seul l'organisateur peut retirer un participant (autre que lui-même)
create policy festorga_participants_delete on festorga_participants
  for delete
  using (festorga_is_organizer(event_id));

-- ---------------------------------------------------------
-- Policies : festorga_expenses
-- ---------------------------------------------------------

-- Voir toutes les dépenses d'un événement auquel on participe
create policy festorga_expenses_select on festorga_expenses
  for select
  using (festorga_is_participant(event_id));

-- Ajouter une dépense : il faut être participant, et en être l'auteur
create policy festorga_expenses_insert on festorga_expenses
  for insert
  with check (
    author_id = auth.uid()
    and festorga_is_participant(event_id)
  );

-- Modifier uniquement ses propres dépenses
create policy festorga_expenses_update on festorga_expenses
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Supprimer uniquement ses propres dépenses
create policy festorga_expenses_delete on festorga_expenses
  for delete
  using (author_id = auth.uid());
