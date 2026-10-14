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

-- ménage : les scores des défis de plus de 60 jours ne servent plus
create or replace function menage_scores() returns void language sql security definer set search_path = public as $$
  delete from scores where quand < now() - interval '60 days';
$$;
revoke all on function menage_scores() from public, anon, authenticated;
