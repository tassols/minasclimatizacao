# Sistema de Metas, Pontos e Bônus — Minas Climatização

Sistema interno para gestão de metas, pontos e bônus por carro/equipe: produção diária, regras de qualidade, PMOC e resultados mensais.

## Funcionalidades

- **Equipes**: cadastro de carros (técnico + auxiliar).
- **Produção**: registro diário (instalação = 3 pts, limpeza química = 1 pt).
- **Qualidade**: retorno Tipo A, checklist e fotos por carro/mês (impactam bônus).
- **PMOC**: contratos ativos por técnico (R$ 40/mês) e registro de falha técnica.
- **Resultados**: página separada para exibir na TV, com atualização automática a cada 2 minutos.

## Como rodar localmente

1. Clone o repositório ou baixe os arquivos.
2. Use um **servidor local** (com Supabase, não abra `index.html` direto como arquivo — use sempre HTTP):
   ```bash
   npx serve -p 3000
   ```
   e acesse `http://localhost:3000`.

## Deploy no GitHub (grátis)

1. Crie um repositório no GitHub.
2. Envie o conteúdo da pasta `minas-metas` para o repositório (na raiz ou numa pasta, conforme preferir).
3. Em **Settings → Pages**, em “Source” escolha **GitHub Actions** (ou “Deploy from a branch”).
4. Se usar **branch**:
   - Branch: `main` (ou `master`).
   - Pasta: `/ (root)` ou a pasta onde está o projeto.
5. Salve. Em alguns minutos o site estará em `https://<seu-usuario>.github.io/<repo>/` (ou `/<repo>/minas-metas/` se tiver subpasta).

### Importante para GitHub Pages

- Use **HTTPS** na URL do site.
- Os dados ficam no **localStorage** do navegador de quem acessa. Para **não perder dados** ao limpar o navegador ou trocar de computador, configure o **Supabase** (veja abaixo).

## Persistência dos dados (evitar perda)

Sem configuração extra, os dados são salvos só no **localStorage** do navegador. Se limpar o cache ou usar outro dispositivo, os dados se perdem.

Para **persistência na nuvem** (dados não se perdem):

1. Crie um projeto em [Supabase](https://supabase.com) (plano gratuito).
2. No **SQL Editor**, execute:

   ```sql
   create table if not exists minas_data (
     id text primary key default 'default',
     payload jsonb not null,
     updated_at timestamptz default now()
   );

   alter table minas_data enable row level security;

   create policy "Allow anonymous read/write for minas_data"
     on minas_data for all
     using (true)
     with check (true);
   ```

3. Em **Project Settings → API**, copie a **Project URL** e a **Publishable API Key** (ou “anon public”).
4. No projeto, abra `config.js` e preencha `url` e `anonKey` com esses valores.
5. Salve, recarregue o site (ou refaça o deploy). Os dados passam a ser gravados no Supabase.

Se não for usar Supabase, não altere `config.js`. O sistema usará apenas o **localStorage** (use **Exportar backup** com frequência).

Enquanto salva, o sistema mostra **“Salvando…”** e depois **“Sincronizado às HH:MM”** (ou **“Salvo às HH:MM”** se estiver só em localStorage). Use **Exportar backup** com frequência como cópia extra.

---

## Checklist de configuração

Use esta lista para conferir se está tudo certo:

- [ ] **Supabase**
  - [ ] Projeto criado em [supabase.com](https://supabase.com).
  - [ ] Tabela `minas_data` criada (SQL acima no SQL Editor).
  - [ ] RLS ativado e política criada (incluída no SQL).
- [ ] **config.js**
  - [ ] `url`: Project URL do Supabase (ex.: `https://xxxx.supabase.co`).
  - [ ] `anonKey`: **Publishable API Key** ou **anon public** (JWT longa) do **Project Settings → API**.
  - [ ] Chave **idêntica** ao painel (sem espaço, nada a mais/menos). Erro *"Invalid API key"* ou *"Salvo localmente (erro ao sincronizar)"* → troque pela chave **anon public** (Legacy API Keys) se a publishable falhar.
- [ ] **Teste**
  - [ ] Abrir `index.html` (ou o site no GitHub Pages).
  - [ ] Cadastrar uma equipe e salvar.
  - [ ] No rodapé, deve aparecer **“Sincronizado às HH:MM”** (com Supabase) ou **“Salvo às HH:MM”** (só localStorage).
- [ ] **Backup**
  - [ ] Clicar em **Exportar backup** e guardar o JSON em local seguro. Fazer isso com frequência.
- [ ] **TV**
  - [ ] Abrir `resultados.html` (ou `.../resultados.html` no deploy).
  - [ ] Escolher mês/ano e conferir se os resultados batem com o sistema.
  - [ ] Na TV, deixar essa página aberta; ela atualiza sozinha a cada 2 minutos.

## Logo

A logo fica em `assets/logo.png`. Substitua pelo arquivo oficial da Minas Climatização se precisar.

## Página de resultados (TV)

- **URL**: `resultados.html` (no mesmo domínio do deploy, ex.: `https://...github.io/.../resultados.html`).
- Use essa página na TV da empresa para todos acompanharem.
- É possível trocar o mês/ano e voltar ao sistema pelo link **“Voltar ao sistema”**.
- A página recarrega os dados a cada 2 minutos.

## Estrutura dos arquivos

```
minas-metas/
├── index.html       # Sistema principal (equipes, produção, qualidade, PMOC)
├── resultados.html  # Página para TV
├── style.css
├── style-tv.css     # Estilos da página TV
├── app.js
├── resultados.js
├── shared.js        # Lógica compartilhada (metas, bônus, cálculos)
├── db.js            # Persistência (Supabase / localStorage)
├── config.js        # Configuração Supabase (editar com suas chaves)
├── config.example.js
├── assets/
│   └── logo.png
└── README.md
```

## Metas oficiais (referência)

| Nível | Pontos/dia | Pontos/mês | Bônus  |
|-------|------------|------------|--------|
| 1     | 6          | 132        | —      |
| 2     | 7–8        | 154–176    | R$ 400 |
| 3     | 9–10       | 198–220    | R$ 800 |
| 4     | 11+        | 242+       | R$ 1.200 |

- Bônus operacional: 60% técnico, 40% auxiliar.
- Bônus qualidade: R$ 200 (zero retorno Tipo A).
- Bônus eficiência: R$ 200 (média ≥ 9 pts/dia).
- PMOC: R$ 40/mês por contrato ativo; falha técnica remove o bônus PMOC do mês.

---

### Erro "Invalid API key" ou 401 ao sincronizar

1. Abra **Project Settings → API** no Supabase.
2. Confira a **Project URL** e compare com `url` no `config.js` (ex.: `gqorlcpsztktyrelmjgw` — sem trocar `gq` por `gg` etc.).
3. Em **API Keys**, teste primeiro a **anon public** (aba "Legacy API Keys" ou "anon" / "public"). É uma chave longa em formato JWT. Copie e cole em `anonKey` no `config.js`.
4. Se o projeto só tiver **Publishable API Key**, copie de novo (sem cortar). Não pode ter espaço no início/fim.
5. Salve o `config.js`, recarregue a página e cadastre de novo. O rodapé deve mostrar **"Sincronizado às HH:MM"**.

---

**Documento interno — Uso restrito. Minas Climatização.**
