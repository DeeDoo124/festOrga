-- Nom affiché du participant, renseigné par le backend à la création/adhésion
-- (permet de nommer tout le monde dans les soldes, même sans dépense ajoutée)
alter table festorga_participants add column if not exists display_name text;
