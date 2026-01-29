/**
 * Sistema de Metas, Pontos e Bônus – Minas Climatização
 * Usa db.js (Supabase ou localStorage) e shared.js.
 */

const getEquipes = () => window.db.getEquipes();
const setEquipes = (a) => window.db.setEquipes(a);
const getProducao = () => window.db.getProducao();
const setProducao = (a) => window.db.setProducao(a);
const getQualidade = () => window.db.getQualidade();
const setQualidade = (a) => window.db.setQualidade(a);
const getPmoc = () => window.db.getPmoc();
const setPmoc = (a) => window.db.setPmoc(a);
const getPmocFalhas = () => window.db.getPmocFalhas();
const setPmocFalhas = (a) => window.db.setPmocFalhas(a);

function getEquipeById(id) {
  return getEquipes().find((e) => e.id === id) || null;
}

function pontosDia(instalacoes, limpezas) {
  return (instalacoes || 0) * 3 + (limpezas || 0) * 1;
}

function uniqueTecnicos() {
  const eq = getEquipes();
  const names = new Set(eq.map((e) => e.tecnico).filter(Boolean));
  return [...names].sort();
}

/* ---------- Tabs ---------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const id = tab.getAttribute('data-tab');
    document.getElementById(id).classList.add('active');
    if (id === 'producao') fillEquipeSelect('prod-equipe');
    if (id === 'qualidade') fillEquipeSelect('qual-equipe');
    if (id === 'pmoc') {
      fillTecnicoSelect('pmoc-tecnico');
      fillTecnicoSelect('pmoc-falha-tecnico');
    }
    renderListas();
  });
});

function fillEquipeSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const eq = getEquipes();
  sel.innerHTML = '<option value="">Selecione o carro</option>' + eq.map((e) => `<option value="${e.id}">${e.carro} – ${e.tecnico}</option>`).join('');
}

function fillTecnicoSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const tec = uniqueTecnicos();
  sel.innerHTML = '<option value="">Selecione</option>' + tec.map((t) => `<option value="${t}">${t}</option>`).join('');
}

/* ---------- Equipes ---------- */
document.getElementById('form-equipe').addEventListener('submit', (e) => {
  e.preventDefault();
  const carro = document.getElementById('equipe-carro').value.trim();
  const tecnico = document.getElementById('equipe-tecnico').value.trim();
  const auxiliar = document.getElementById('equipe-auxiliar').value.trim();
  const arr = getEquipes();
  arr.push({ id: genId(), carro, tecnico, auxiliar });
  setEquipes(arr);
  document.getElementById('form-equipe').reset();
  renderListas();
});

function renderListaEquipes() {
  const ul = document.getElementById('lista-equipes');
  const eq = getEquipes();
  ul.innerHTML = eq.length === 0 ? '<li class="empty">Nenhuma equipe cadastrada.</li>' : eq.map((e) => `
    <li>
      <span><strong>${e.carro}</strong> · ${e.tecnico} / ${e.auxiliar}</span>
      <button type="button" class="btn-remove" data-equipe-id="${e.id}">Remover</button>
    </li>
  `).join('');
  ul.querySelectorAll('.btn-remove').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-equipe-id');
      setEquipes(getEquipes().filter((e) => e.id !== id));
      setProducao(getProducao().filter((p) => p.equipeId !== id));
      setQualidade(getQualidade().filter((q) => q.equipeId !== id));
      renderListas();
    });
  });
}

/* ---------- Produção ---------- */
document.getElementById('form-producao').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = document.getElementById('prod-data').value;
  const equipeId = document.getElementById('prod-equipe').value;
  const instalacoes = parseInt(document.getElementById('prod-instalacoes').value, 10) || 0;
  const limpezas = parseInt(document.getElementById('prod-limpezas').value, 10) || 0;
  const pontos = pontosDia(instalacoes, limpezas);
  const arr = getProducao();
  arr.push({ id: genId(), data, equipeId, instalacoes, limpezas, pontos });
  setProducao(arr);
  document.getElementById('prod-instalacoes').value = 0;
  document.getElementById('prod-limpezas').value = 0;
  updatePreviewPontos();
  renderListas();
});

function updatePreviewPontos() {
  const i = parseInt(document.getElementById('prod-instalacoes').value, 10) || 0;
  const l = parseInt(document.getElementById('prod-limpezas').value, 10) || 0;
  document.getElementById('preview-pontos').textContent = pontosDia(i, l);
}

document.getElementById('prod-instalacoes').addEventListener('input', updatePreviewPontos);
document.getElementById('prod-limpezas').addEventListener('input', updatePreviewPontos);

let filtroProdMes = null;

document.getElementById('btn-filtrar-prod').addEventListener('click', () => {
  filtroProdMes = document.getElementById('filtro-prod-mes').value || null;
  renderListaProducao();
});

function renderListaProducao() {
  const ul = document.getElementById('lista-producao');
  let arr = getProducao();
  const eq = getEquipes();
  if (filtroProdMes) {
    const [y, m] = filtroProdMes.split('-').map(Number);
    arr = arr.filter((p) => {
      const [py, pm] = p.data.split('-').map(Number);
      return py === y && pm === m;
    });
  }
  arr = arr.slice().sort((a, b) => b.data.localeCompare(a.data));
  const byCar = (id) => eq.find((e) => e.id === id)?.carro || id;
  ul.innerHTML = arr.length === 0 ? '<li class="empty">Nenhum registro.</li>' : arr.slice(0, 80).map((p) => `
    <li>
      <span>${p.data} · ${byCar(p.equipeId)} · ${p.instalacoes} inst. + ${p.limpezas} limpezas</span>
      <span class="badge">${p.pontos} pts</span>
      <button type="button" class="btn-remove" data-prod-id="${p.id}">Remover</button>
    </li>
  `).join('');
  ul.querySelectorAll('.btn-remove').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-prod-id');
      setProducao(getProducao().filter((p) => p.id !== id));
      renderListaProducao();
    });
  });
}

/* ---------- Qualidade ---------- */
document.getElementById('form-qualidade').addEventListener('submit', (e) => {
  e.preventDefault();
  const mesAno = document.getElementById('qual-mes').value;
  const [ano, mes] = mesAno.split('-').map(Number);
  const equipeId = document.getElementById('qual-equipe').value;
  const retornoA = document.getElementById('qual-retorno-a').checked;
  const checklist = document.getElementById('qual-checklist').checked;
  const fotos = document.getElementById('qual-fotos').checked;
  const arr = getQualidade();
  const idx = arr.findIndex((q) => String(q.ano) === String(ano) && String(q.mes) === String(mes) && q.equipeId === equipeId);
  const row = { mes: Number(mes), ano: Number(ano), equipeId, retornoA, checklist, fotos };
  if (idx >= 0) arr[idx] = row;
  else arr.push(row);
  setQualidade(arr);
  document.getElementById('qual-retorno-a').checked = false;
  document.getElementById('qual-checklist').checked = false;
  document.getElementById('qual-fotos').checked = false;
  renderListas();
});

function renderListaQualidade() {
  const ul = document.getElementById('lista-qualidade');
  const arr = getQualidade().slice().sort((a, b) => b.ano - a.ano || b.mes - a.mes);
  const eq = getEquipes();
  const byCar = (id) => eq.find((e) => e.id === id)?.carro || id;
  ul.innerHTML = arr.length === 0 ? '<li class="empty">Nenhum registro.</li>' : arr.map((q) => `
    <li>
      <span>${String(q.mes).padStart(2, '0')}/${q.ano} · ${byCar(q.equipeId)}</span>
      <span class="badge">A: ${q.retornoA ? 'Sim' : 'Não'} · Check: ${q.checklist ? 'Sim' : 'Não'} · Fotos: ${q.fotos ? 'Sim' : 'Não'}</span>
    </li>
  `).join('');
}

/* ---------- PMOC ---------- */
document.getElementById('form-pmoc').addEventListener('submit', (e) => {
  e.preventDefault();
  const ref = document.getElementById('pmoc-ref').value.trim();
  const tecnico = document.getElementById('pmoc-tecnico').value;
  const ativo = document.getElementById('pmoc-ativo').checked;
  if (!tecnico) {
    alert('Selecione o técnico responsável.');
    return;
  }
  const arr = getPmoc();
  arr.push({ id: genId(), ref, tecnico, ativo });
  setPmoc(arr);
  document.getElementById('pmoc-ref').value = '';
  document.getElementById('pmoc-ativo').checked = true;
  renderListas();
});

document.getElementById('form-pmoc-falha').addEventListener('submit', (e) => {
  e.preventDefault();
  const mesAno = document.getElementById('pmoc-falha-mes').value;
  const tecnico = document.getElementById('pmoc-falha-tecnico').value;
  if (!mesAno || !tecnico) {
    alert('Preencha mês/ano e técnico.');
    return;
  }
  const [ano, mes] = mesAno.split('-').map(Number);
  const arr = getPmocFalhas();
  const exists = arr.some((f) => f.ano === ano && f.mes === mes && f.tecnico === tecnico);
  if (!exists) arr.push({ id: genId(), mes: Number(mes), ano: Number(ano), tecnico });
  setPmocFalhas(arr);
  document.getElementById('form-pmoc-falha').reset();
  const now = new Date();
  document.getElementById('pmoc-falha-mes').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  renderListas();
});

function renderListaPmoc() {
  const ul = document.getElementById('lista-pmoc');
  const arr = getPmoc();
  ul.innerHTML = arr.length === 0 ? '<li class="empty">Nenhum contrato PMOC.</li>' : arr.map((p) => `
    <li>
      <span><strong>${p.ref}</strong> · ${p.tecnico} ${p.ativo ? '(ativo)' : '(inativo)'}</span>
      <button type="button" class="btn-remove" data-pmoc-id="${p.id}">Remover</button>
    </li>
  `).join('');
  ul.querySelectorAll('.btn-remove').forEach((b) => {
    b.addEventListener('click', () => {
      setPmoc(getPmoc().filter((p) => p.id !== b.getAttribute('data-pmoc-id')));
      renderListaPmoc();
    });
  });
}

/* ---------- Resultados (link para TV) ---------- */
function setDefaultMonthInputs() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const vMonth = `${y}-${m}`;
  const vDate = `${y}-${m}-${d}`;
  const elData = document.getElementById('prod-data');
  if (elData) elData.value = vDate;
  ['qual-mes', 'filtro-prod-mes', 'pmoc-falha-mes'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = vMonth;
  });
  filtroProdMes = vMonth;
}

function renderListas() {
  renderListaEquipes();
  renderListaProducao();
  renderListaQualidade();
  renderListaPmoc();
}

document.getElementById('btn-exportar').addEventListener('click', () => {
  const backup = {
    equipes: getEquipes(),
    producao: getProducao(),
    qualidade: getQualidade(),
    pmoc: getPmoc(),
    pmocFalhas: getPmocFalhas(),
    exportadoEm: new Date().toISOString().slice(0, 10),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `minas-metas-backup-${backup.exportadoEm}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('btn-importar').addEventListener('click', () => document.getElementById('input-importar').click());
document.getElementById('input-importar').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const b = JSON.parse(r.result);
      if (!Array.isArray(b.equipes)) throw new Error('Formato inválido.');
      setEquipes(b.equipes || []);
      setProducao(b.producao || []);
      setQualidade(b.qualidade || []);
      setPmoc(b.pmoc || []);
      setPmocFalhas(b.pmocFalhas || []);
      alert('Backup importado. A página será recarregada.');
      location.reload();
    } catch (err) {
      alert('Erro ao importar: ' + (err.message || 'arquivo inválido'));
    }
  };
  r.readAsText(f);
  e.target.value = '';
});

async function init() {
  await window.db.load();
  setDefaultMonthInputs();
  fillEquipeSelect('prod-equipe');
  fillEquipeSelect('qual-equipe');
  fillTecnicoSelect('pmoc-tecnico');
  fillTecnicoSelect('pmoc-falha-tecnico');
  updatePreviewPontos();
  renderListas();
}

init();
