# 🚀 Quick Start - Supabase Cotações

Guia rápido para começar a usar o sistema de Edge Functions.

---

## ⚡ 5 Minutos de Setup

### 1. Clonar Repositório
```bash
git clone seu-repositorio-url
cd supabase-cotacoes
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Fazer Login
```bash
supabase login
```

### 4. Vincular Projeto
```bash
supabase link --project-ref seu-project-ref
```

### 5. Pronto! 🎉

---

## 📝 Comandos Principais

```bash
# Listar functions
npm run list

# Desenvolver localmente
npm run dev

# Deploy tudo
npm run deploy

# Deploy por fluxo
npm run deploy:fluxo0
npm run deploy:fluxo1
npm run deploy:fluxo2

# Parar servidor local
npm run stop
```

---

## 🔗 Endpoints Disponíveis

### Fluxo 0: Tela Inicial
```
GET  /fluxo-0-listar-emissoes?page=1&limit=10&status=rascunho
GET  /fluxo-0-detalhes-emissao/{id}
```

### Fluxo 1: Calculadora
```
POST /fluxo-1-criar-emissao
PUT  /fluxo-1-atualizar-emissao/{id}
POST /fluxo-1-salvar-custos/{id}
```

### Fluxo 2: Proposta
```
GET  /fluxo-2-gerar-pdf/{id}
PUT  /fluxo-2-finalizar-proposta/{id}
```

---

## 📚 Exemplos de Uso

### Criar Emissão
```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/fluxo-1-criar-emissao' \
  -H 'Authorization: Bearer seu-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "demandante_proposta": "Empresa ABC",
    "empresa_destinataria": "Empresa XYZ",
    "categoria": "DEB",
    "volume": 1000000,
    "quantidade_series": 2,
    "comercial_id": "uuid-comercial"
  }'
```

### Listar Emissões
```bash
curl -X GET 'https://seu-projeto.supabase.co/functions/v1/fluxo-0-listar-emissoes?status=rascunho' \
  -H 'Authorization: Bearer seu-token'
```

### Salvar Custos
```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/fluxo-1-salvar-custos/{id}' \
  -H 'Authorization: Bearer seu-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "fee_agente_fiduciario_upfront": 15000,
    "fee_securitizadora_upfront": 20000
  }'
```

---

## 🔐 Autenticação

Todas as requisições precisam do token JWT:

```
Authorization: Bearer seu-token-jwt
```

Para obter o token:
1. Vá para https://supabase.com/dashboard
2. Clique no seu projeto
3. Settings → API
4. Copie o "anon key"

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "supabase: command not found" | `npm install -g supabase` |
| "Project not found" | Verifique o project-ref com `supabase projects list` |
| "Port 54321 already in use" | `supabase stop` depois `npm run dev` |
| "Docker is not running" | Instale Docker Desktop |

---

## 📖 Documentação Completa

Veja `README.md` para documentação completa.

---

## 💬 Dúvidas?

Consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- README.md deste projeto

---

**Boa sorte! 🚀**

