# ERP Profissional para Gestão de Restaurantes

Sistema completo de gestão de restaurantes com controle de multiestoque, integrações (Mercado Pago PIX, iFood) e Dashboard BI.

## Stack Tecnológica

- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: Vite + React + TypeScript + CSS Modules
- **Banco de Dados**: PostgreSQL
- **Deploy**: Render

## Estrutura do Projeto

```
gestao/
├── api/          # Backend
├── client/       # Frontend
└── render.yaml   # Deploy configuration
```

## Instalação

```bash
# Instalar dependências
npm install
cd api && npm install
cd ../client && npm install

# Configurar banco de dados
cd api
cp .env.example .env
npx prisma migrate dev

# Executar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

### API (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/gestao
JWT_SECRET=your-secret-key
MERCADOPAGO_ACCESS_TOKEN=your-mp-token
IFOOD_CLIENT_ID=your-ifood-id
IFOOD_CLIENT_SECRET=your-ifood-secret
```

## Licença

MIT
