import { WHATSAPP_NUMERO } from './supabase.js';

export function raridadePillClass(raridade) {
  const r = (raridade || '').toLowerCase();
  if (r.includes('lend')) return 'raridade-lendaria';
  if (r.includes('rara') || r.includes('épica') || r.includes('epica')) return 'raridade-rara';
  return 'raridade-normal';
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#171d2c"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="#2a3346">?</text></svg>`
  );

export function pokemonImageUrl(pokemon) {
  return pokemon.imagem_url || PLACEHOLDER_IMG;
}

export function renderCard(pokemon) {
  const emprestado = pokemon.status === 'emprestado';
  const raridadeClass = raridadePillClass(pokemon.raridade);

  return `
    <div class="poke-card ${emprestado ? 'emprestado' : ''}" data-id="${pokemon.id}">
      <div class="img-wrap">
        <img src="${pokemonImageUrl(pokemon)}" alt="${escapeHtml(pokemon.nome)}" loading="lazy" />
      </div>
      ${emprestado
        ? '<span class="badge-emprestado">EMPRESTADO</span>'
        : '<span class="badge-status">DISPONÍVEL</span>'}
      ${pokemon.disponivel_para_venda ? '<span class="badge-venda">À VENDA</span>' : ''}
      <div class="info">
        <p class="name">${escapeHtml(pokemon.nome)}</p>
        <div class="meta">
          <span class="pill level">Nv. ${pokemon.nivel ?? '?'}</span>
          ${pokemon.raridade ? `<span class="pill ${raridadeClass}">${escapeHtml(pokemon.raridade)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function attrRow(label, attr) {
  if (!attr) return '';
  const tendencia = attr.tendencia === 'alta' ? ' ▲' : attr.tendencia === 'baixa' ? ' ▼' : '';
  return `
    <tr>
      <td class="attr-name">${label}${tendencia}</td>
      <td class="attr-value">${attr.valor ?? '-'} ${attr.iv ? `<span style="color:var(--text-dim); font-weight:400;">(${attr.iv})</span>` : ''}</td>
    </tr>
  `;
}

function whatsappLink(pokemon) {
  const numero = pokemon.whatsapp_numero || WHATSAPP_NUMERO;
  const precoTexto = pokemon.preco_venda
    ? `pelo valor de ${formatarPreco(pokemon.preco_venda)}`
    : 'e quero dar um lance';
  const texto = encodeURIComponent(
    `Olá! Tenho interesse no ${pokemon.nome} (Nv. ${pokemon.nivel}) ${precoTexto}.`
  );
  return `https://wa.me/${numero}?text=${texto}`;
}

export function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function renderDetail(pokemon) {
  const emprestado = pokemon.status === 'emprestado';
  const atributos = pokemon.atributos || {};
  const genetica = pokemon.genetica || {};
  const hpPct = pokemon.hp_max ? Math.round((pokemon.hp_atual / pokemon.hp_max) * 100) : 0;
  const ivPct = pokemon.iv_max ? Math.round((pokemon.iv_total / pokemon.iv_max) * 100) : 0;

  return `
    <button class="modal-close" id="modal-close">✕</button>

    <div class="detail-header ${emprestado ? 'emprestado' : ''}">
      <div class="img-wrap">
        <img src="${pokemonImageUrl(pokemon)}" alt="${escapeHtml(pokemon.nome)}" />
      </div>
      <div>
        <h2>${escapeHtml(pokemon.nome)}</h2>
        <div class="meta">
          <span class="pill level">Nv. ${pokemon.nivel ?? '?'}</span>
          ${pokemon.raridade ? `<span class="pill ${raridadePillClass(pokemon.raridade)}">${escapeHtml(pokemon.raridade)} ${escapeHtml(pokemon.raridade_multiplicador || '')}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="status-banner ${emprestado ? 'emprestado' : 'disponivel'}">
      ${emprestado
        ? `🔒 Emprestado para <strong>&nbsp;${escapeHtml(pokemon.emprestado_para || 'desconhecido')}</strong>`
        : '✅ Disponível para empréstimo'}
    </div>

    ${pokemon.hp_max ? `
    <div class="card-block">
      <div class="label">HP</div>
      <div class="value">${pokemon.hp_atual}/${pokemon.hp_max}</div>
      <div class="bar-track"><div class="bar-fill hp" style="width:${hpPct}%"></div></div>
    </div>` : ''}

    <div class="row-2">
      ${pokemon.poder_total_maestria != null ? `
      <div class="card-block">
        <div class="label">Poder total c/ maestria</div>
        <div class="value">${pokemon.poder_total_maestria}</div>
      </div>` : ''}
      ${pokemon.iv_total != null ? `
      <div class="card-block">
        <div class="label">IV Total</div>
        <div class="value">${pokemon.iv_total}/${pokemon.iv_max ?? ''}</div>
        <div class="bar-track"><div class="bar-fill iv" style="width:${ivPct}%"></div></div>
      </div>` : ''}
    </div>

    ${pokemon.maestria_elemental ? `
    <div class="card-block">
      <div class="label">Maestria elemental</div>
      <div class="value" style="font-size:0.95rem;">${escapeHtml(pokemon.maestria_elemental)}</div>
    </div>` : ''}

    ${Object.keys(atributos).length ? `
    <div class="section-title">Atributos de batalha</div>
    <div class="card-block">
      <table class="attr-table">
        ${attrRow('HP', atributos.hp)}
        ${attrRow('ATK', atributos.atk)}
        ${attrRow('ATK SP', atributos.atkSp)}
        ${attrRow('DEF', atributos.def)}
        ${attrRow('DEF SP', atributos.defSp)}
        ${attrRow('VEL', atributos.vel)}
      </table>
    </div>` : ''}

    ${Object.keys(genetica).length ? `
    <div class="section-title">Genética</div>
    <div class="card-block">
      <table class="attr-table">
        ${genetica.natureza ? `<tr><td class="attr-name">Natureza</td><td class="attr-value">${escapeHtml(genetica.natureza)}</td></tr>` : ''}
        ${genetica.ganhoPerda ? `<tr><td class="attr-name">Ganho/perda</td><td class="attr-value">${escapeHtml(genetica.ganhoPerda)}</td></tr>` : ''}
        ${genetica.genero ? `<tr><td class="attr-name">Gênero</td><td class="attr-value">${escapeHtml(genetica.genero)}</td></tr>` : ''}
        ${genetica.bonusExtra ? `<tr><td class="attr-name">Bônus</td><td class="attr-value">${escapeHtml(genetica.bonusExtra)}</td></tr>` : ''}
      </table>
    </div>` : ''}

    ${pokemon.disponivel_para_venda ? `
    <div class="venda-block">
      <div class="preco">${pokemon.preco_venda ? formatarPreco(pokemon.preco_venda) : 'Aceita lances'}</div>
      <a class="btn-whatsapp" href="${whatsappLink(pokemon)}" target="_blank" rel="noopener">
        💬 Falar no WhatsApp
      </a>
    </div>` : ''}
  `;
}
