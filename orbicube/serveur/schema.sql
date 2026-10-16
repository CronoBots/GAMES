-- Le classement d'Orbicube (Supabase, Postgres). Aucune table n'est lisible ni modifiable par le public : RLS
-- activé sans politique, et seule la fonction `orbicube` (clé de service, côté serveur) y touche.
-- Ce qu'on garde d'un joueur : un identifiant tiré au hasard, son pseudo, ses scores, et sa sauvegarde s'il l'envoie.
-- Ni nom, ni e-mail, ni compte Apple ou Google, ni adresse IP.

create table if not exists joueurs (
  id uuid primary key default gen_random_uuid(),
  pseudo text not null check (char_length(pseudo) between 3 and 16),
  code_hash text not null unique,          -- empreinte du code de récupération (jamais le code lui-même)
  jeton_hash text not null,                -- empreinte du jeton du téléphone actuel : un seul téléphone à la fois
  rang int not null default 1,
  xp int not null default 0,
  etoiles int not null default 0,
  etoiles_temps int not null default 0,
  etoiles_total int generated always as (etoiles + etoiles_temps) stored,
  voies int not null default 0,
  sansfin int not null default 0,
  mecene boolean not null default false,
  sauvegarde jsonb,
  sauvegarde_maj timestamptz,
  cree_le timestamptz not null default now(),
  vu_le timestamptz not null default now()
);
create unique index if not exists joueurs_pseudo on joueurs (lower(pseudo));
create index if not exists joueurs_xp on joueurs (xp desc);
create index if not exists joueurs_etoiles on joueurs (etoiles_total desc);
create index if not exists joueurs_sansfin on joueurs (sansfin desc);

-- un score par joueur et par tableau (« jour:20261014 », « semaine:2026-S42 ») : le meilleur
create table if not exists scores (
  joueur uuid not null references joueurs (id) on delete cascade,
  tableau text not null,
  coups int not null,
  temps_ms int not null,
  quand timestamptz not null default now(),
  primary key (joueur, tableau)
);
create index if not exists scores_tableau on scores (tableau, coups, temps_ms);

-- un signalement par joueur et par auteur ; trois signalements remettent le pseudo à « Player… »
create table if not exists signalements (
  joueur uuid not null references joueurs (id) on delete cascade,
  par uuid not null references joueurs (id) on delete cascade,
  quand timestamptz not null default now(),
  primary key (joueur, par)
);

alter table joueurs enable row level security;
alter table scores enable row level security;
alter table signalements enable row level security;
revoke all on joueurs, scores, signalements from anon, authenticated;

-- limites de débit : un compteur par clé (« score:<joueur> », « inscrire ») et par fenêtre ; aucune adresse IP
create table if not exists limites (
  cle text not null,
  fenetre timestamptz not null,
  n int not null default 0,
  primary key (cle, fenetre)
);
alter table limites enable row level security;
revoke all on limites from anon, authenticated;
-- vrai tant que la clé n'a pas dépassé p_max appels dans sa fenêtre de p_secondes (compte et répond en une fois)
create or replace function compter(p_cle text, p_max int, p_secondes int) returns boolean language plpgsql security definer
set search_path = public as $$
declare f timestamptz := to_timestamp(floor(extract(epoch from now()) / p_secondes) * p_secondes); v int;
begin
  insert into limites (cle, fenetre, n) values (p_cle, f, 1)
    on conflict (cle, fenetre) do update set n = limites.n + 1 returning n into v;
  return v <= p_max;
end $$;
revoke all on function compter(text, int, int) from public, anon, authenticated;

-- ménage, une fois par jour : les scores des défis de plus de 60 jours (la politique de confidentialité le promet),
-- les compteurs passés, et les profils sans aucune visite depuis deux ans
create or replace function menage_scores() returns void language sql security definer set search_path = public as $$
  delete from scores where quand < now() - interval '60 days';
  delete from limites where fenetre < now() - interval '2 days';
  delete from joueurs where vu_le < now() - interval '2 years';
$$;
revoke all on function menage_scores() from public, anon, authenticated;
-- planifié par pg_cron (à activer dans Database > Extensions) : obligatoire avant la sortie
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('orbicube-menage', '17 3 * * *', 'select menage_scores()');
  end if;
end $$;
