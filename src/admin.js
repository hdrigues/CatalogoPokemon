import { supabase, POKEMON_BUCKET } from './supabase.js';
import { TIPOS_POKEMON } from './pokemon-types.js';

const loginSection = document.getElementById('login-section');
const listSection = document.getElementById('list-section');
const formSection = document.getElementById('form-section');
const btnLogout = document.getElementById('btn-logout');

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const adminList = document.getElementById('admin-list');
const listCount = document.getElementById('list-count');
const btnNovo = document.getElementById('btn-novo');

const pokemonForm = document.getElementById('pokemon-form');
const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const btnCancelar = document.getElementById('btn-cancelar');

const fEmprestado = document.getElementById('f-emprestado');
const wrapEmprestadoPara = document.getElementById('wrap-emprestado-para');
const fVenda = document.getElementById('f-venda');
const wrapPreco = document.getElementById('wrap-preco');
const wrapWhatsapp = document.getElementById('wrap-whatsapp');
const fImagem = document.getElementById('f-imagem');
const fImagemPreview = document.getElementById('f-imagem-preview');
const fTipo1 = document.getElementById('f-tipo1');
const fTipo2 = document.getElementById('f-tipo2');
const fDono = document.getElementById('f-dono');
const wrapImagemUpload = document.getElementById('wrap-imagem-upload');
const wrapImagemPokeapi = document.getElementById('wrap-imagem-pokeapi');
const fPokeapiBusca = document.getElementById('f-pokeapi-busca');
const fPokeapiResultados = document.getElementById('f-pokeapi-resultados');
const adminFiltersEl = document.getElementById('admin-filters');

let pokemons = [];
let imagemArquivo = null;
let imagemUrlAtual = '';
let filtroAdminAtivo = 'todos';

function popularSelectTipos(select, comOpcaoVazia) {
  select.innerHTML =
    (comOpcaoVazia ? '<option value="">-</option>' : '<option value="">Selecione...</option>') +
    TIPOS_POKEMON.map((t) => `<option value="${t}">${t}</option>`).join('');
}

popularSelectTipos(fTipo1, false);
popularSelectTipos(fTipo2, true);

function showSection(section) {
  [loginSection, listSection, formSection].forEach((s) => s.classList.add('hidden'));
  section.classList.remove('hidden');
}

function toggleWrap(el, visible) {
  el.classList.toggle('hidden', !visible);
}

fEmprestado.addEventListener('change', () => toggleWrap(wrapEmprestadoPara, fEmprestado.checked));
fVenda.addEventListener('change', () => {
  toggleWrap(wrapPreco, fVenda.checked);
  toggleWrap(wrapWhatsapp, fVenda.checked);
});

fImagem.addEventListener('change', () => {
  const file = fImagem.files[0];
  if (!file) return;
  imagemArquivo = file;
  fImagemPreview.src = URL.createObjectURL(file);
  fImagemPreview.classList.remove('hidden');
});

// ---------- PokéAPI ----------

let pokeapiListaNomes = null;

async function carregarListaPokeapi() {
  if (pokeapiListaNomes) return pokeapiListaNomes;
  const resp = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
  const json = await resp.json();
  pokeapiListaNomes = json.results.map((p) => p.name);
  return pokeapiListaNomes;
}

document.querySelectorAll('input[name="f-imagem-modo"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const usaPokeapi = document.getElementById('f-imagem-modo-pokeapi').checked;
    toggleWrap(wrapImagemUpload, !usaPokeapi);
    toggleWrap(wrapImagemPokeapi, usaPokeapi);
    if (usaPokeapi) carregarListaPokeapi();
  });
});

let pokeapiBuscaTimeout = null;
fPokeapiBusca.addEventListener('input', () => {
  clearTimeout(pokeapiBuscaTimeout);
  const termo = fPokeapiBusca.value.trim().toLowerCase();
  if (!termo) {
    fPokeapiResultados.classList.add('hidden');
    fPokeapiResultados.innerHTML = '';
    return;
  }
  pokeapiBuscaTimeout = setTimeout(async () => {
    const nomes = await carregarListaPokeapi();
    const encontrados = nomes.filter((n) => n.includes(termo)).slice(0, 8);
    if (!encontrados.length) {
      fPokeapiResultados.innerHTML = '<div style="padding:8px 10px; color:var(--text-dim);">Nenhum resultado</div>';
      fPokeapiResultados.classList.remove('hidden');
      return;
    }
    fPokeapiResultados.innerHTML = encontrados
      .map((n) => `<button type="button" data-nome="${n}">${n}</button>`)
      .join('');
    fPokeapiResultados.classList.remove('hidden');
  }, 300);
});

fPokeapiResultados.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-nome]');
  if (!btn) return;
  const nome = btn.dataset.nome;
  btn.disabled = true;
  btn.textContent = `Carregando ${nome}...`;
  try {
    const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
    const data = await resp.json();
    const url =
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default;
    if (!url) throw new Error('Sem imagem disponível para esse pokémon.');

    imagemArquivo = null;
    imagemUrlAtual = url;
    fImagemPreview.src = url;
    fImagemPreview.classList.remove('hidden');
    fPokeapiBusca.value = nome;
    fPokeapiResultados.classList.add('hidden');
    fPokeapiResultados.innerHTML = '';
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove('hidden');
  }
});

// ---------- Auth ----------

async function checarSessao() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    btnLogout.classList.remove('hidden');
    showSection(listSection);
    carregarLista();
  } else {
    btnLogout.classList.add('hidden');
    showSection(loginSection);
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'Login inválido: ' + error.message;
    loginError.classList.remove('hidden');
    return;
  }
  checarSessao();
});

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  checarSessao();
});

// ---------- Lista ----------

async function carregarLista() {
  const { data, error } = await supabase.from('pokemons').select('*').order('nome');
  if (error) {
    adminList.innerHTML = `<div class="empty-state">Erro: ${error.message}</div>`;
    return;
  }
  pokemons = data || [];
  listCount.textContent = `${pokemons.length} pokémon(s)`;
  renderLista();
}

function aplicarFiltroAdmin(lista) {
  switch (filtroAdminAtivo) {
    case 'emprestado':
      return lista.filter((p) => p.status === 'emprestado');
    case 'venda':
      return lista.filter((p) => p.disponivel_para_venda);
    default:
      return lista;
  }
}

adminFiltersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  filtroAdminAtivo = btn.dataset.filter;
  adminFiltersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
  renderLista();
});

function renderLista() {
  const lista = aplicarFiltroAdmin(pokemons);

  if (!lista.length) {
    adminList.innerHTML = '<div class="empty-state">Nenhum pokémon encontrado.</div>';
    return;
  }

  adminList.innerHTML = lista
    .map(
      (p) => `
    <div class="admin-list-item">
      <img src="${p.imagem_url || ''}" alt="" />
      <div class="grow">
        <div class="name">${p.nome}</div>
        <div style="font-size:0.78rem; color:var(--text-dim);">
          Nv. ${p.nivel ?? '?'} · ${p.status === 'emprestado' ? 'Emprestado' : 'Disponível'}${p.disponivel_para_venda ? ' · À venda' : ''}
        </div>
        <div style="font-size:0.78rem; color:var(--orange);">
          ${p.raridade ? p.raridade : ''}${p.raridade_multiplicador ? ` · ${p.raridade_multiplicador}` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" data-action="editar" data-id="${p.id}">✏️</button>
        <button class="icon-btn" data-action="excluir" data-id="${p.id}">🗑️</button>
      </div>
    </div>
  `
    )
    .join('');
}

adminList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const pokemon = pokemons.find((p) => String(p.id) === id);
  if (btn.dataset.action === 'editar') abrirFormulario(pokemon);
  if (btn.dataset.action === 'excluir') excluirPokemon(pokemon);
});

async function excluirPokemon(pokemon) {
  if (!confirm(`Excluir "${pokemon.nome}"? Essa ação não pode ser desfeita.`)) return;
  const { error } = await supabase.from('pokemons').delete().eq('id', pokemon.id);
  if (error) {
    alert('Erro ao excluir: ' + error.message);
    return;
  }
  carregarLista();
}

btnNovo.addEventListener('click', () => abrirFormulario(null));
btnCancelar.addEventListener('click', () => {
  showSection(listSection);
});

// ---------- Formulário ----------

function parseAttr(str) {
  if (!str) return undefined;
  const valorMatch = str.match(/-?\d+(\.\d+)?/);
  const ivMatch = str.match(/\d+\s*\/\s*\d+/);
  const tendencia = /alta/i.test(str) ? 'alta' : /baixa/i.test(str) ? 'baixa' : undefined;
  return {
    valor: valorMatch ? Number(valorMatch[0]) : undefined,
    iv: ivMatch ? ivMatch[0].replace(/\s+/g, '') : undefined,
    tendencia,
  };
}

function formatAttr(attr) {
  if (!attr) return '';
  const partes = [];
  if (attr.valor != null) partes.push(attr.valor);
  if (attr.iv) partes.push('· ' + attr.iv);
  if (attr.tendencia) partes.push(`(${attr.tendencia})`);
  return partes.join(' ');
}

function abrirFormulario(pokemon) {
  pokemonForm.reset();
  formError.classList.add('hidden');
  imagemArquivo = null;
  imagemUrlAtual = pokemon?.imagem_url || '';
  fImagemPreview.src = imagemUrlAtual;
  fImagemPreview.classList.toggle('hidden', !imagemUrlAtual);

  document.getElementById('f-imagem-modo-upload').checked = true;
  toggleWrap(wrapImagemUpload, true);
  toggleWrap(wrapImagemPokeapi, false);
  fPokeapiBusca.value = '';
  fPokeapiResultados.classList.add('hidden');
  fPokeapiResultados.innerHTML = '';

  formTitle.textContent = pokemon ? `Editar: ${pokemon.nome}` : 'Novo pokémon';
  document.getElementById('f-id').value = pokemon?.id || '';
  document.getElementById('f-nome').value = pokemon?.nome || '';
  fDono.value = pokemon?.dono || '';
  document.getElementById('f-nivel').value = pokemon?.nivel ?? 1;
  document.getElementById('f-raridade').value = pokemon?.raridade || 'Normal';
  document.getElementById('f-raridade-mult').value = pokemon?.raridade_multiplicador || '';
  const tipos = pokemon?.tipos || [];
  fTipo1.value = tipos[0] || '';
  fTipo2.value = tipos[1] || '';
  document.getElementById('f-hp-atual').value = pokemon?.hp_atual ?? '';
  document.getElementById('f-hp-max').value = pokemon?.hp_max ?? '';
  document.getElementById('f-poder-total').value = pokemon?.poder_total_maestria ?? '';
  document.getElementById('f-maestria-elemental').value = pokemon?.maestria_elemental || '';
  document.getElementById('f-iv-total').value = pokemon?.iv_total ?? '';
  document.getElementById('f-iv-max').value = pokemon?.iv_max ?? '';

  const atributos = pokemon?.atributos || {};
  document.getElementById('f-attr-hp').value = formatAttr(atributos.hp);
  document.getElementById('f-attr-atk').value = formatAttr(atributos.atk);
  document.getElementById('f-attr-atksp').value = formatAttr(atributos.atkSp);
  document.getElementById('f-attr-def').value = formatAttr(atributos.def);
  document.getElementById('f-attr-defsp').value = formatAttr(atributos.defSp);
  document.getElementById('f-attr-vel').value = formatAttr(atributos.vel);

  const genetica = pokemon?.genetica || {};
  document.getElementById('f-natureza').value = genetica.natureza || '';
  document.getElementById('f-genero').value = genetica.genero || '';
  document.getElementById('f-ganho-perda').value = genetica.ganhoPerda || '';
  document.getElementById('f-bonus-extra').value = genetica.bonusExtra || '';

  fEmprestado.checked = pokemon?.status === 'emprestado';
  document.getElementById('f-emprestado-para').value = pokemon?.emprestado_para || '';
  toggleWrap(wrapEmprestadoPara, fEmprestado.checked);

  fVenda.checked = !!pokemon?.disponivel_para_venda;
  document.getElementById('f-preco').value = pokemon?.preco_venda ?? '';
  document.getElementById('f-whatsapp').value = pokemon?.whatsapp_numero || '';
  toggleWrap(wrapPreco, fVenda.checked);
  toggleWrap(wrapWhatsapp, fVenda.checked);

  showSection(formSection);
}

async function uploadImagemSeNecessario() {
  if (!imagemArquivo) return imagemUrlAtual || null;

  const ext = imagemArquivo.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(POKEMON_BUCKET)
    .upload(path, imagemArquivo, { upsert: false });

  if (uploadError) throw new Error('Falha no upload da imagem: ' + uploadError.message);

  const { data } = supabase.storage.from(POKEMON_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

pokemonForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');

  const btnSalvar = document.getElementById('btn-salvar');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    const imagemUrl = await uploadImagemSeNecessario();

    const tipos = [fTipo1.value, fTipo2.value].filter(Boolean);

    const payload = {
      nome: document.getElementById('f-nome').value.trim(),
      dono: fDono.value.trim() || null,
      imagem_url: imagemUrl,
      nivel: Number(document.getElementById('f-nivel').value) || 1,
      raridade: document.getElementById('f-raridade').value,
      raridade_multiplicador: document.getElementById('f-raridade-mult').value.trim() || null,
      tipos,
      hp_atual: numOrNull('f-hp-atual'),
      hp_max: numOrNull('f-hp-max'),
      poder_total_maestria: numOrNull('f-poder-total'),
      maestria_elemental: document.getElementById('f-maestria-elemental').value.trim() || null,
      iv_total: numOrNull('f-iv-total'),
      iv_max: numOrNull('f-iv-max'),
      atributos: {
        hp: parseAttr(document.getElementById('f-attr-hp').value),
        atk: parseAttr(document.getElementById('f-attr-atk').value),
        atkSp: parseAttr(document.getElementById('f-attr-atksp').value),
        def: parseAttr(document.getElementById('f-attr-def').value),
        defSp: parseAttr(document.getElementById('f-attr-defsp').value),
        vel: parseAttr(document.getElementById('f-attr-vel').value),
      },
      genetica: {
        natureza: document.getElementById('f-natureza').value.trim() || null,
        genero: document.getElementById('f-genero').value || null,
        ganhoPerda: document.getElementById('f-ganho-perda').value.trim() || null,
        bonusExtra: document.getElementById('f-bonus-extra').value.trim() || null,
      },
      status: fEmprestado.checked ? 'emprestado' : 'disponivel',
      emprestado_para: fEmprestado.checked ? document.getElementById('f-emprestado-para').value.trim() : null,
      disponivel_para_venda: fVenda.checked,
      preco_venda: fVenda.checked ? numOrNull('f-preco') : null,
      whatsapp_numero: fVenda.checked ? document.getElementById('f-whatsapp').value.trim() || null : null,
    };

    const id = document.getElementById('f-id').value;

    const { error } = id
      ? await supabase.from('pokemons').update(payload).eq('id', id)
      : await supabase.from('pokemons').insert(payload);

    if (error) throw new Error(error.message);

    showSection(listSection);
    carregarLista();
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove('hidden');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
});

function numOrNull(id) {
  const v = document.getElementById(id).value;
  return v === '' ? null : Number(v);
}

checarSessao();
