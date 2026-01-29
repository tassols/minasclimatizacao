/**
 * Lógica compartilhada (app + resultados TV)
 */

window.MINAS_BONUS = {
  NIVEL_2: 400,
  NIVEL_3: 800,
  NIVEL_4: 1200,
  QUALIDADE: 200,
  EFICIENCIA: 200,
  PMOC: 40,
};

window.MINAS_METAS = [
  { min: 0, max: 131, nivel: 1, bonus: 0 },
  { min: 132, max: 153, nivel: 1, bonus: 0 },
  { min: 154, max: 197, nivel: 2, bonus: 400 },
  { min: 198, max: 241, nivel: 3, bonus: 800 },
  { min: 242, max: Infinity, nivel: 4, bonus: 1200 },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function pontosDia(instalacoes, limpezas) {
  return (instalacoes || 0) * 3 + (limpezas || 0) * 1;
}

function nivelFromPontos(total) {
  const m = window.MINAS_METAS.find((r) => total >= r.min && total <= r.max);
  return m ? { nivel: m.nivel, bonus: m.bonus } : { nivel: 1, bonus: 0 };
}

function formatMoney(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function calcResultados(mesAno, getEquipes, getProducao, getQualidade, getPmoc, getPmocFalhas) {
  const BONUS = window.MINAS_BONUS;
  const [ano, mes] = mesAno.split('-').map(Number);
  const eq = getEquipes();
  const prod = getProducao();
  const qual = getQualidade();
  const pmoc = getPmoc();
  const falhas = getPmocFalhas();

  const prodMes = prod.filter((p) => {
    const [py, pm] = p.data.split('-').map(Number);
    return py === ano && pm === mes;
  });

  const porEquipe = {};
  for (const p of prodMes) {
    if (!porEquipe[p.equipeId]) porEquipe[p.equipeId] = { pontos: 0, dias: new Set() };
    porEquipe[p.equipeId].pontos += p.pontos;
    porEquipe[p.equipeId].dias.add(p.data);
  }

  const qualMes = qual.filter((q) => q.ano === ano && q.mes === mes);
  const qualByEquipe = {};
  for (const q of qualMes) qualByEquipe[q.equipeId] = q;

  const falhasMes = falhas.filter((f) => f.ano === ano && f.mes === mes);
  const falhaTecnico = new Set(falhasMes.map((f) => f.tecnico));

  const ativosPmoc = pmoc.filter((p) => p.ativo);
  const pmocPorTecnico = {};
  for (const p of ativosPmoc) {
    pmocPorTecnico[p.tecnico] = (pmocPorTecnico[p.tecnico] || 0) + 1;
  }

  const carros = [];
  for (const e of eq) {
    const d = porEquipe[e.id];
    const totalPontos = d ? d.pontos : 0;
    const diasTrabalhados = d ? d.dias.size : 0;
    const mediaDia = diasTrabalhados ? totalPontos / diasTrabalhados : 0;
    const { nivel, bonus: bonusOp } = nivelFromPontos(totalPontos);
    const q = qualByEquipe[e.id];

    let perdeBonusOp = false;
    let motivoPerda = null;
    if (q) {
      if (q.retornoA) {
        perdeBonusOp = true;
        motivoPerda = 'Retorno Tipo A';
      } else if (!q.checklist || !q.fotos) {
        perdeBonusOp = true;
        motivoPerda = !q.checklist && !q.fotos ? 'Checklist e fotos ausentes' : !q.checklist ? 'Checklist ausente' : 'Fotos ausentes';
      }
    } else if (totalPontos > 0) {
      perdeBonusOp = true;
      motivoPerda = 'Qualidade não registrada';
    }

    const bonusOperacional = perdeBonusOp ? 0 : bonusOp;
    const bonusQualidade = q && !q.retornoA ? BONUS.QUALIDADE : 0;
    const bonusEficiencia = mediaDia >= 9 ? BONUS.EFICIENCIA : 0;
    const valorTecnico = bonusOperacional * 0.6;
    const valorAux = bonusOperacional * 0.4;

    carros.push({
      equipe: e,
      totalPontos,
      diasTrabalhados,
      mediaDia,
      nivel,
      bonusOperacional,
      perdeBonusOp,
      motivoPerda,
      bonusQualidade,
      bonusEficiencia,
      valorTecnico,
      valorAux,
    });
  }

  const tecnicos = [];
  const tecSet = new Set(eq.map((e) => e.tecnico));
  for (const t of tecSet) {
    const n = pmocPorTecnico[t] || 0;
    const perde = falhaTecnico.has(t);
    const total = perde ? 0 : n * BONUS.PMOC;
    tecnicos.push({ tecnico: t, contratos: n, perde, total });
  }

  return { ano, mes, carros, tecnicos };
}
