-- Ajoute le nom affiché de l'auteur, renseigné par le backend à la création
-- (évite d'avoir à interroger auth.users, inaccessible via RLS côté client)
alter table festorga_expenses add column if not exists author_name text;
