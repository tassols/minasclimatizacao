/**
 * Camada de dados: Supabase (quando configurado) + localStorage como backup.
 * Garante persistência e feedback "Salvo" / "Sincronizado".
 */

(function () {
  const STORAGE = {
    EQUIPES: 'minas_equipes',
    PRODUCAO: 'minas_producao',
    QUALIDADE: 'minas_qualidade',
    PMOC: 'minas_pmoc',
    PMOC_FALHAS: 'minas_pmoc_falhas',
  };

  const store = {
    equipes: [],
    producao: [],
    qualidade: [],
    pmoc: [],
    pmocFalhas: [],
  };

  let supabaseClient = null;
  const cfg = window.MINAS_SUPABASE;
  const useSupabase = typeof cfg === 'object' && cfg && cfg.url && cfg.anonKey
    && !String(cfg.url).includes('SEU_PROJETO') && !String(cfg.anonKey).includes('SUA_')
    && typeof supabase !== 'undefined';
  if (useSupabase) {
    try {
      const { createClient } = supabase;
      supabaseClient = createClient(window.MINAS_SUPABASE.url, window.MINAS_SUPABASE.anonKey);
    } catch (_) {}
  }

  function persistToLocal() {
    try {
      localStorage.setItem(STORAGE.EQUIPES, JSON.stringify(store.equipes));
      localStorage.setItem(STORAGE.PRODUCAO, JSON.stringify(store.producao));
      localStorage.setItem(STORAGE.QUALIDADE, JSON.stringify(store.qualidade));
      localStorage.setItem(STORAGE.PMOC, JSON.stringify(store.pmoc));
      localStorage.setItem(STORAGE.PMOC_FALHAS, JSON.stringify(store.pmocFalhas));
    } catch (e) {
      console.warn('localStorage persist error', e);
    }
  }

  function loadFromLocal() {
    try {
      store.equipes = JSON.parse(localStorage.getItem(STORAGE.EQUIPES) || '[]');
      store.producao = JSON.parse(localStorage.getItem(STORAGE.PRODUCAO) || '[]');
      store.qualidade = JSON.parse(localStorage.getItem(STORAGE.QUALIDADE) || '[]');
      store.pmoc = JSON.parse(localStorage.getItem(STORAGE.PMOC) || '[]');
      store.pmocFalhas = JSON.parse(localStorage.getItem(STORAGE.PMOC_FALHAS) || '[]');
    } catch (e) {
      console.warn('localStorage load error', e);
    }
  }

  function payload() {
    return {
      equipes: store.equipes,
      producao: store.producao,
      qualidade: store.qualidade,
      pmoc: store.pmoc,
      pmocFalhas: store.pmocFalhas,
    };
  }

  function setPayload(p) {
    if (p.equipes) store.equipes = p.equipes;
    if (p.producao) store.producao = p.producao;
    if (p.qualidade) store.qualidade = p.qualidade;
    if (p.pmoc) store.pmoc = p.pmoc;
    if (p.pmocFalhas) store.pmocFalhas = p.pmocFalhas;
  }

  function showStatus(msg, isError) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'save-status' + (isError ? ' error' : '');
  }

  let saveTimeout = null;
  function debouncedSupabaseSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      saveTimeout = null;
      const el = document.getElementById('save-status');
      if (el && supabaseClient) {
        el.textContent = 'Salvando…';
        el.className = 'save-status';
      }
      const ok = await persistToSupabase();
      if (el && supabaseClient) {
        el.textContent = ok
          ? 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : 'Salvo localmente (erro ao sincronizar). Exporte backup.';
        el.className = 'save-status ' + (ok ? 'ok' : 'error');
      }
    }, 300);
  }

  async function persistToSupabase() {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient.from('minas_data').upsert(
        { id: 'default', payload: payload(), updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase persist error', e);
      return false;
    }
  }

  async function loadFromSupabase() {
    if (!supabaseClient) return false;
    try {
      const { data, error } = await supabaseClient.from('minas_data').select('payload').eq('id', 'default').single();
      if (error || !data || !data.payload) return false;
      setPayload(data.payload);
      return true;
    } catch (e) {
      console.warn('Supabase load error', e);
      return false;
    }
  }

  function saveAll() {
    persistToLocal();
    const el = document.getElementById('save-status');
    if (supabaseClient) {
      debouncedSupabaseSave();
      if (el) {
        el.textContent = 'Salvando…';
        el.className = 'save-status';
      }
    } else {
      if (el) {
        el.textContent = 'Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        el.className = 'save-status ok';
      }
    }
  }

  window.db = {
    async load() {
      const fromSupabase = await loadFromSupabase();
      if (!fromSupabase) loadFromLocal();
      return payload();
    },
    saveAll,
    get equipes() { return store.equipes.slice(); },
    set equipes(v) { store.equipes = v; saveAll(); },
    get producao() { return store.producao.slice(); },
    set producao(v) { store.producao = v; saveAll(); },
    get qualidade() { return store.qualidade.slice(); },
    set qualidade(v) { store.qualidade = v; saveAll(); },
    get pmoc() { return store.pmoc.slice(); },
    set pmoc(v) { store.pmoc = v; saveAll(); },
    get pmocFalhas() { return store.pmocFalhas.slice(); },
    set pmocFalhas(v) { store.pmocFalhas = v; saveAll(); },
    getEquipes: () => store.equipes.slice(),
    setEquipes(arr) { store.equipes = arr; saveAll(); },
    getProducao: () => store.producao.slice(),
    setProducao(arr) { store.producao = arr; saveAll(); },
    getQualidade: () => store.qualidade.slice(),
    setQualidade(arr) { store.qualidade = arr; saveAll(); },
    getPmoc: () => store.pmoc.slice(),
    setPmoc(arr) { store.pmoc = arr; saveAll(); },
    getPmocFalhas: () => store.pmocFalhas.slice(),
    setPmocFalhas(arr) { store.pmocFalhas = arr; saveAll(); },
    hasSupabase: () => !!supabaseClient,
  };
})();
