-- Rode este script no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor > New query).

create table if not exists pokemons (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),

  nome text not null,
  imagem_url text,
  nivel integer not null default 1,
  raridade text,
  raridade_multiplicador text,
  tipos text[] default '{}',

  hp_atual integer,
  hp_max integer,
  poder_total_maestria integer,
  iv_total integer,
  iv_max integer,
  maestria_elemental text,

  atributos jsonb default '{}'::jsonb,
  genetica jsonb default '{}'::jsonb,

  status text not null default 'disponivel' check (status in ('disponivel', 'emprestado')),
  emprestado_para text,

  disponivel_para_venda boolean not null default false,
  preco_venda numeric,
  whatsapp_numero text
);

alter table pokemons enable row level security;

-- Leitura pública (o catálogo é visível para todos, sem login)
create policy "Leitura publica de pokemons"
  on pokemons for select
  using (true);

-- Escrita só para usuários autenticados (o dono, logado no admin)
create policy "Escrita autenticada de pokemons"
  on pokemons for insert
  with check (auth.role() = 'authenticated');

create policy "Atualizacao autenticada de pokemons"
  on pokemons for update
  using (auth.role() = 'authenticated');

create policy "Exclusao autenticada de pokemons"
  on pokemons for delete
  using (auth.role() = 'authenticated');

-- Storage: crie um bucket chamado "pokemon-imagens" (público) pelo Dashboard > Storage
-- e aplique estas policies em Storage > Policies para esse bucket:
--
-- SELECT (leitura): using ( bucket_id = 'pokemon-imagens' )
-- INSERT/UPDATE/DELETE (escrita): using ( bucket_id = 'pokemon-imagens' and auth.role() = 'authenticated' )
