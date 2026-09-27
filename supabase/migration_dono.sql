-- Rode este script no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor > New query).
-- Adiciona o campo "dono" a bancos ja existentes (quem e o dono do pokemon).

alter table pokemons add column if not exists dono text;
