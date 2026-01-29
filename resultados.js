/**
 * Página de Resultados (TV) — Minas Climatização
 */

(function () {
  const main = document.getElementById('tv-main');
  const inputMes = document.getElementById('tv-mes');
  const elUpdated = document.getElementById('tv-updated');

  function mesDefault() {
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  }

  function formatMoney(v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  function render() {
    const mesAno = inputMes.value || mesDefault();
    inputMes.value = mesAno;

    const getEquipes = () => window.db.getEquipes();
    const getProducao = () => window.db.getProducao();
    const getQualidade = () => window.db.getQualidade();
    const getPmoc = () => window.db.getPmoc();
    const getPmocFalhas = () => window.db.getPmocFalhas();

    const { ano, mes, carros, tecnicos } = calcResultados(
      mesAno, getEquipes, getProducao, getQualidade, getPmoc, getPmocFalhas
    );
    const mesLabel = String(mes).padStart(2, '0') + '/' + ano;

    let html = '';

    html += '<div class="tv-section"><h2>Resultados ' + mesLabel + '</h2>';
    html += '<div class="tv-grid">';

    for (const c of carros) {
      const e = c.equipe;
      const nc = 'n' + c.nivel;
      html += '<div class="tv-card">';
      html += '<p class="carro">' + e.carro + ' — ' + e.tecnico + ' / ' + e.auxiliar + '</p>';
      html += '<p>Pontos: <strong>' + c.totalPontos + '</strong> (' + c.diasTrabalhados + ' dias) · Média: <strong>' + c.mediaDia.toFixed(1) + '</strong> pts/dia</p>';
      html += '<p class="nivel ' + nc + '">Nível ' + c.nivel + '</p>';
      if (c.perdeBonusOp && c.motivoPerda) {
        html += '<p class="perda">Perda bônus: ' + c.motivoPerda + '</p>';
      }
      html += '<p class="bonus-line">Técnico: <span class="bonus-val">' + formatMoney(c.valorTecnico) + '</span> (op.)';
      if (c.bonusQualidade) html += ' + ' + formatMoney(c.bonusQualidade) + ' (qual.)';
      if (c.bonusEficiencia) html += ' + ' + formatMoney(c.bonusEficiencia) + ' (efíc.)';
      html += '</p>';
      html += '<p class="bonus-line">Auxiliar: <span class="bonus-val">' + formatMoney(c.valorAux) + '</span> (op.)</p>';
      html += '</div>';
    }

    if (carros.length === 0) {
      html += '<div class="tv-card"><p>Nenhuma equipe com produção no mês.</p></div>';
    }

    html += '</div></div>';

    const pmocList = tecnicos.filter((t) => t.contratos > 0);
    if (pmocList.length) {
      html += '<div class="tv-section"><h2>Bônus PMOC ' + mesLabel + '</h2><ul class="tv-pmoc-list">';
      for (const t of pmocList) {
        const val = t.perde
          ? '<span class="pmoc-falha">falha → R$ 0</span>'
          : '<span class="pmoc-val">' + formatMoney(t.total) + '</span>';
        html += '<li><span>' + t.tecnico + '</span> <span>' + t.contratos + ' contrato(s) ' + val + '</span></li>';
      }
      html += '</ul></div>';
    }

    main.innerHTML = html;
    if (elUpdated) elUpdated.textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR');
  }

  async function init() {
    main.innerHTML = '<p class="tv-loading">Carregando…</p>';
    await window.db.load();
    inputMes.value = mesDefault();
    inputMes.addEventListener('change', render);
    render();

    setInterval(function () {
      window.db.load().then(render);
    }, 2 * 60 * 1000);
  }

  init();
})();
