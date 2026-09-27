import { supabase } from './supabase.js';
import { renderCard, renderDetail } from './ui-components.js';
import { TIPOS_POKEMON } from './pokemon-types.js';

const grid = document.getElementById('grid');
const filtersEl = document.getElementById('filters');
const modalOverlay = document.getElementById('modal-overlay');
const modalSheet = document.getElementById('modal-sheet');
const filtroElementoEl = document.getElementById('filtro-elemento');
const filtroNivelEl = document.getElementById('filtro-nivel');

filtroElementoEl.innerHTML +=
  TIPOS_POKEMON.map((t) => `<option value="${t}">${t}</option>`).join('');

let pokemons = [];
let filtroAtivo = 'todos';
let filtroElemento = 'todos';
let filtroNivelMin = null;

async function carregarPokemons() {
  const { data, error } = await supabase
    .from('pokemons')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    grid.innerHTML = `<div class="empty-state">Erro ao carregar: ${error.message}</div>`;
    return;
  }

  pokemons = data || [];
  render();
}

function aplicarFiltro(lista) {
  let resultado = lista;

  switch (filtroAtivo) {
    case 'disponivel':
      resultado = resultado.filter((p) => p.status === 'disponivel');
      break;
    case 'emprestado':
      resultado = resultado.filter((p) => p.status === 'emprestado');
      break;
    case 'venda':
      resultado = resultado.filter((p) => p.disponivel_para_venda);
      break;
  }

  if (filtroElemento !== 'todos') {
    resultado = resultado.filter((p) => (p.tipos || []).includes(filtroElemento));
  }

  if (filtroNivelMin != null) {
    resultado = resultado.filter((p) => (p.nivel ?? 0) >= filtroNivelMin);
  }

  return resultado;
}

function render() {
  const lista = aplicarFiltro(pokemons);

  if (!lista.length) {
    grid.innerHTML = '<div class="empty-state">Nenhum pokémon encontrado.</div>';
    return;
  }

  grid.innerHTML = lista.map(renderCard).join('');

  grid.querySelectorAll('.poke-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const pokemon = pokemons.find((p) => String(p.id) === id);
      if (pokemon) abrirDetalhe(pokemon);
    });
  });
}

function abrirDetalhe(pokemon) {
  modalSheet.innerHTML = renderDetail(pokemon);
  modalOverlay.hidden = false;
  document.getElementById('modal-close').addEventListener('click', fecharDetalhe);
}

function fecharDetalhe() {
  modalOverlay.hidden = true;
  modalSheet.innerHTML = '';
}

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) fecharDetalhe();
});

filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  filtroAtivo = btn.dataset.filter;
  filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
  render();
});

filtroElementoEl.addEventListener('change', () => {
  filtroElemento = filtroElementoEl.value;
  render();
});

filtroNivelEl.addEventListener('input', () => {
  const v = filtroNivelEl.value;
  filtroNivelMin = v === '' ? null : Number(v);
  render();
});

carregarPokemons();
