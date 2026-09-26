import { supabase } from './supabase.js';
import { renderCard, renderDetail } from './ui-components.js';

const grid = document.getElementById('grid');
const filtersEl = document.getElementById('filters');
const modalOverlay = document.getElementById('modal-overlay');
const modalSheet = document.getElementById('modal-sheet');

let pokemons = [];
let filtroAtivo = 'todos';

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
  switch (filtroAtivo) {
    case 'disponivel':
      return lista.filter((p) => p.status === 'disponivel');
    case 'emprestado':
      return lista.filter((p) => p.status === 'emprestado');
    case 'venda':
      return lista.filter((p) => p.disponivel_para_venda);
    default:
      return lista;
  }
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

carregarPokemons();
