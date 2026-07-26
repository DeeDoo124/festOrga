-- =========================================================
-- Festorga — Remboursements (confirmation à deux)
-- =========================================================

create table if not exists festorga_settlements (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references festorga_events(id) on delete cascade,
  from_user_id  uuid not null references auth.users(id) on delete cascade, -- celui qui paie
  to_user_id    uuid not null references auth.users(id) on delete cascade, -- celui qui reçoit
  amount        numeric(10,2) not null check (amount > 0),
  status        text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz
);

create index if not exists idx_festorga_settlements_event
  on festorga_settlements(event_id);

alter table festorga_settlements enable row level security;

-- Voir les remboursements d'un événement auquel on participe
create policy festorga_settlements_select on festorga_settlements
  for select
  using (festorga_is_participant(event_id));

-- Déclarer un remboursement : uniquement en tant que débiteur (from_user_id = soi-même)
create policy festorga_settlements_insert on festorga_settlements
  for insert
  with check (from_user_id = auth.uid() and festorga_is_participant(event_id));

-- Confirmer un remboursement : uniquement le créditeur (to_user_id) peut le faire passer à "confirmed"
create policy festorga_settlements_update on festorga_settlements
  for update
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- Annuler / refuser une déclaration en attente : le débiteur (annuler) ou le
-- créditeur (refuser), mais seulement tant qu'elle n'est pas confirmée
create policy festorga_settlements_delete on festorga_settlements
  for delete
  using ((from_user_id = auth.uid() or to_user_id = auth.uid()) and status = 'pending');
