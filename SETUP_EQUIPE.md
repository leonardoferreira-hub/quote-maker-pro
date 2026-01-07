# 📋 Instruções de Setup para a Equipe

## ✅ O Que Está Pronto

Você tem um repositório completo com:

- ✅ **7 Edge Functions** (código TypeScript pronto)
- ✅ **Estrutura Git** (com .gitignore)
- ✅ **Documentação Completa** (README + QUICKSTART)
- ✅ **Scripts npm** (para facilitar deploy)
- ✅ **Configuração Supabase** (config.toml)

---

## 🚀 Próximos Passos

### 1. Criar Repositório Git (GitHub/GitLab/Bitbucket)

```bash
# Criar repositório vazio no GitHub
# Depois, no seu computador:

cd supabase-cotacoes
git init
git add .
git commit -m "feat: initial commit - edge functions"
git branch -M main
git remote add origin https://github.com/seu-usuario/supabase-cotacoes.git
git push -u origin main
```

### 2. Compartilhar com a Equipe

Envie o link do repositório para os colegas:
```
https://github.com/seu-usuario/supabase-cotacoes
```

### 3. Cada Membro da Equipe Faz:

```bash
# Clonar
git clone https://github.com/seu-usuario/supabase-cotacoes.git
cd supabase-cotacoes

# Instalar Supabase CLI (uma vez)
npm install -g supabase

# Fazer login
supabase login

# Vincular ao projeto
supabase link --project-ref seu-project-ref

# Pronto para desenvolver!
```

---

## 📁 Estrutura Criada

```
supabase-cotacoes/
├── supabase/
│   ├── functions/
│   │   ├── fluxo-0-listar-emissoes/
│   │   │   └── index.ts
│   │   ├── fluxo-0-detalhes-emissao/
│   │   │   └── index.ts
│   │   ├── fluxo-1-criar-emissao/
│   │   │   └── index.ts
│   │   ├── fluxo-1-atualizar-emissao/
│   │   │   └── index.ts
│   │   ├── fluxo-1-salvar-custos/
│   │   │   └── index.ts
│   │   ├── fluxo-2-gerar-pdf/
│   │   │   └── index.ts
│   │   └── fluxo-2-finalizar-proposta/
│   │       └── index.ts
│   └── config.toml
├── .gitignore
├── package.json
├── README.md
├── QUICKSTART.md
└── SETUP_EQUIPE.md (este arquivo)
```

---

## 🔧 Comandos Disponíveis

```bash
# Listar todas as functions
npm run list

# Desenvolver localmente
npm run dev

# Deploy de tudo
npm run deploy

# Deploy por fluxo
npm run deploy:fluxo0
npm run deploy:fluxo1
npm run deploy:fluxo2

# Parar servidor local
npm run stop
```

---

## 📊 7 Edge Functions Criadas

### Fluxo 0: Tela Inicial
1. **fluxo-0-listar-emissoes** - GET com filtros e paginação
2. **fluxo-0-detalhes-emissao** - GET detalhes completos

### Fluxo 1: Calculadora
3. **fluxo-1-criar-emissao** - POST nova cotação
4. **fluxo-1-atualizar-emissao** - PUT atualizar dados
5. **fluxo-1-salvar-custos** - POST/PUT salvar custos

### Fluxo 2: Proposta
6. **fluxo-2-gerar-pdf** - GET gera HTML do PDF
7. **fluxo-2-finalizar-proposta** - PUT finaliza e envia

---

## 🔐 Autenticação

Todas as functions usam JWT do Supabase.

Para testar localmente:
```bash
npm run dev
# Depois acesse: http://localhost:54321/functions/v1/fluxo-0-listar-emissoes
```

---

## 🌐 URLs de Produção

Após deploy:
```
https://seu-projeto.supabase.co/functions/v1/fluxo-0-listar-emissoes
https://seu-projeto.supabase.co/functions/v1/fluxo-0-detalhes-emissao/{id}
https://seu-projeto.supabase.co/functions/v1/fluxo-1-criar-emissao
... etc
```

---

## 📚 Documentação

- **README.md** - Documentação completa
- **QUICKSTART.md** - Guia rápido (5 minutos)
- **SETUP_EQUIPE.md** - Este arquivo

---

## ✨ Recursos Inclusos

✅ CORS habilitado
✅ Tratamento de erros
✅ Validação de dados
✅ Autenticação JWT
✅ Cálculo automático de totais
✅ Histórico de mudanças
✅ Geração de HTML para PDF
✅ Suporte a múltiplos assinantes

---

## 🎯 Próximas Fases

1. ✅ **Backend (Edge Functions)** - PRONTO
2. ⏳ **Frontend (Lovable)** - Próximo
3. ⏳ **Integração Hubspot** - Depois
4. ⏳ **CI/CD** - Opcional

---

## 💡 Dicas

1. **Sempre trabalhe em branches**
   ```bash
   git checkout -b feature/sua-feature
   ```

2. **Teste localmente antes de fazer deploy**
   ```bash
   npm run dev
   ```

3. **Faça commits pequenos e descritivos**
   ```bash
   git commit -m "feat: adicionar validação de volume"
   ```

4. **Use Pull Requests para revisão**
   - Crie PR no GitHub
   - Peça revisão de um colega
   - Merge após aprovação

---

## 🆘 Suporte

- Documentação Supabase: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- Dúvidas: Abra uma issue no repositório

---

## 📞 Contato

Qualquer dúvida sobre o setup, entre em contato com o time tech.

---

**Última atualização:** Janeiro 2026

