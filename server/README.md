# Backend API - Seu Próprio Formulário

Backend Node.js + Express + PostgreSQL para o aplicativo de criação de formulários.

## Pré-requisitos

- Node.js 18+ instalado

## Instalação

1. Entre na pasta do servidor:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

3. O arquivo `.env` já está configurado com as credenciais do banco de dados.

## Executar o Servidor

### Modo de Desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo de Produção:
```bash
npm start
```

O servidor estará rodando em `http://localhost:3001`

## Endpoints da API

### Autenticação

- **POST** `/api/auth/signup` - Criar nova conta
  - Body: `{ name, email, password, pendingXp? }`
  - Retorna: `{ token, user }`

- **POST** `/api/auth/login` - Fazer login
  - Body: `{ email, password }`
  - Retorna: `{ token, user }`

### Formulários (requer autenticação)

- **GET** `/api/forms` - Listar todos os formulários do usuário
- **POST** `/api/forms` - Criar novo formulário
  - Body: `{ title, fields, theme?, logoUrl? }`
- **PUT** `/api/forms/:id` - Atualizar formulário
  - Body: `{ title, fields, theme?, logoUrl? }`
- **DELETE** `/api/forms/:id` - Deletar formulário

### Submissões

- **GET** `/api/submissions/:formId` - Listar respostas de um formulário (requer autenticação)
- **POST** `/api/submissions` - Enviar resposta (público, não requer autenticação)
  - Body: `{ formId, answers }`

## Estrutura do Banco de Dados

O schema é criado automaticamente na primeira execução. Tabelas:

- **users** - Usuários do sistema
- **forms** - Formulários criados
- **submissions** - Respostas enviadas

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. O token deve ser enviado no header:
```
Authorization: Bearer <token>
```

O token é válido por 7 dias.

