# Mini Formulário Responsivo Mobile com Webhook n8n

Formulário moderno, responsivo e mobile-first para captura rápida de leads com 4 campos essenciais:
- **Nome completo** (`name`)
- **Telefone / WhatsApp** (`phone`) com máscara automática brasileira `(XX) XXXXX-XXXX`
- **E-mail** (`email`)
- **Nome da Empresa** (`company`)

Os dados são enviados diretamente para o webhook do n8n:
`https://n8n.nexusdevhub.com/webhook/4d5aa228-e370-428b-9a9e-0148abb02e51`

---

## 🚀 Como subir no Coolify

O projeto já inclui todos os arquivos de configuração necessários para o Coolify:
- `Dockerfile` (multi-stage com Node 22 e build do Vite)
- `docker-compose.yml` (para deploy via compose)
- `.dockerignore`
- Servidor backend Express em `server.ts` com endpoint `/api/submit` (elimina qualquer problema de CORS no navegador com o n8n)
- Healthcheck ativo em `/api/health`

### Opção 1: Via Git Repository no Coolify (Recomendado)
1. Suba este código para o seu repositório no GitHub/GitLab.
2. No painel do Coolify, clique em **+ New Resource** > **Public/Private Git Repository**.
3. Conecte o repositório.
4. O Coolify detectará automaticamente o **Dockerfile**.
5. Configure:
   - **Porta interna**: `3000`
   - **Domínio**: seu domínio com SSL automático pelo Coolify (ex: `https://contato.seudominio.com.br`)
6. Clique em **Deploy**.

### Opção 2: Via Docker Compose no Coolify
1. No Coolify, crie um recurso do tipo **Docker Compose**.
2. Aponte para este repositório ou cole o conteúdo de `docker-compose.yml`.
3. Defina a porta `3000`.
4. Clique em **Deploy**.

---

## ⚙️ Variáveis de Ambiente (Opcional)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta onde o servidor Node/Express escuta |
| `NODE_ENV` | `production` | Ambiente de execução |
| `N8N_WEBHOOK_URL` | `https://n8n.nexusdevhub.com/webhook/4d5aa228-e370-428b-9a9e-0148abb02e51` | URL do webhook do n8n |

---

## 📦 Estrutura do Payload enviado ao n8n

```json
{
  "name": "Fernando Silva",
  "phone": "(11) 98765-4321",
  "email": "fernando@empresa.com.br",
  "company": "Nexus Dev Hub",
  "submittedAt": "2026-10-21T18:50:00.000Z",
  "source": "coolify_mobile_form",
  "utm": {
    "utm_source": "google",
    "utm_campaign": "leads"
  },
  "clientMetadata": {
    "referrer": "direct",
    "isMobileDevice": true
  }
}
```
