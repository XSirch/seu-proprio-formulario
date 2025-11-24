# SPF - Seu Próprio Formulário

> Um construtor de formulários interativos de nova geração que usa IA para gerar insights poderosos e aumentar taxas de resposta com gamificação.

## 🎯 Sobre

**SPF** é uma plataforma fullstack para criar, compartilhar e analisar formulários interativos com:

- ✨ **IA Integrada** - Geração automática de relatórios de BI e sugestões de melhoria
- 🎮 **Gamificação** - XP, barras de progresso e animações fluidas para aumentar engajamento
- 📊 **Insights Reais** - Dashboards automáticos que transformam dados brutos em decisões estratégicas
- 🔐 **Autenticação Segura** - JWT-based auth com suporte a múltiplos usuários
- 🌐 **Formulários Públicos** - Compartilhe links públicos para respostas anônimas
- 🔒 **Chaves de API Criptografadas** - Armazenamento seguro de chaves Gemini por usuário

## 🚀 Stack Tecnológico

### Frontend
- **React 19** + **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS** (via CDN)
- **Google Generative AI** (@google/genai)

### Backend
- **Node.js 22** + **Express**
- **PostgreSQL** (banco de dados)
- **JWT** (autenticação)
- **bcryptjs** (hash de senhas)
- **AES-256-GCM** (criptografia de chaves de API)

### DevOps
- **Docker** (fullstack image)
- **Docker Compose** (orquestração local)
- **GitHub** (versionamento)

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 22+
- PostgreSQL 12+
- Docker & Docker Compose (opcional, para containerização)

### Desenvolvimento Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/XSirch/seu-proprio-formulario.git
   cd seu-proprio-formulario
   ```

2. **Instale dependências (frontend):**
   ```bash
   npm install
   ```

3. **Instale dependências (backend):**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure variáveis de ambiente:**

   Crie um arquivo `.env.local` na raiz:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Crie um arquivo `server/.env`:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/form
   JWT_SECRET=your_jwt_secret_key
   PORT=3001
   NODE_ENV=development
   ```

5. **Inicie o PostgreSQL:**
   ```bash
   # Usando Docker
   docker run --name spf-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

   # Ou use seu PostgreSQL local
   ```

6. **Inicialize o banco de dados:**
   ```bash
   cd server
   node init-db.js
   cd ..
   ```

7. **Inicie o backend (em um terminal):**
   ```bash
   cd server
   npm start
   ```

8. **Inicie o frontend (em outro terminal):**
   ```bash
   npm run dev
   ```

9. **Acesse a aplicação:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

### Docker (Produção)

**Build da imagem fullstack:**
```bash
docker build -t christianoccruz/spf:latest -t christianoccruz/spf:v1.0 .
```

**Push para Docker Hub:**
```bash
docker push christianoccruz/spf:latest
docker push christianoccruz/spf:v1.0
```

**Executar com Docker Compose (desenvolvimento):**
```bash
docker-compose up -d
```

**Executar imagem fullstack:**
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgres://user:pass@db:5432/form \
  -e JWT_SECRET=your_secret \
  christianoccruz/spf:latest
```

## 📁 Estrutura do Projeto

```
seu-proprio-formulario/
├── components/              # Componentes React
│   ├── LandingPage.tsx     # Página inicial
│   ├── AuthPage.tsx        # Login/Cadastro
│   ├── HomePage.tsx        # Dashboard
│   ├── FormBuilder.tsx     # Editor de formulários
│   ├── LivePreview.tsx     # Preview gamificado
│   ├── PublicFormView.tsx  # Formulários públicos
│   ├── SettingsPage.tsx    # Configurações de usuário
│   └── Icons.tsx           # Ícones customizados
├── services/
│   ├── api.ts              # Cliente HTTP para backend
│   └── gemini.ts           # Integração com Google Generative AI
├── types.ts                # Tipos TypeScript
├── App.tsx                 # Componente raiz
├── index.html              # HTML principal
├── vite.config.ts          # Configuração Vite
├── Dockerfile              # Build fullstack (frontend + backend)
├── docker-compose.yml      # Orquestração local
├── server/
│   ├── index.js            # Servidor Express
│   ├── db.js               # Conexão PostgreSQL
│   ├── init-db.js          # Inicialização do banco
│   ├── schema.sql          # Schema do banco de dados
│   ├── middleware/
│   │   └── auth.js         # Middleware JWT
│   ├── routes/
│   │   ├── auth.js         # Rotas de autenticação
│   │   ├── forms.js        # Rotas de formulários
│   │   ├── submissions.js  # Rotas de respostas
│   │   └── userSettings.js # Rotas de configurações
│   ├── package.json
│   └── .env                # Variáveis de ambiente
├── package.json
└── README.md
```

## 🔑 Variáveis de Ambiente

### Frontend (`.env.local`)
- `VITE_API_BASE_URL` - URL base da API backend (padrão: `http://localhost:3001/api`)
- `VITE_GEMINI_API_KEY` - Chave da API Google Generative AI (opcional, pode ser configurada por usuário)

### Backend (`server/.env`)
- `DATABASE_URL` - String de conexão PostgreSQL
- `JWT_SECRET` - Chave secreta para assinar JWTs
- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (development/production)

## 🔐 Segurança

- **Senhas** - Hash com bcryptjs (salt rounds: 10)
- **Autenticação** - JWT com expiração configurável
- **Chaves de API** - Criptografia AES-256-GCM por usuário, nunca armazenadas em localStorage
- **CORS** - Configurado para aceitar requisições do frontend
- **Validação** - Validação de entrada em todas as rotas

## 📝 Scripts Disponíveis

### Frontend
```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Lint com ESLint
```

### Backend
```bash
cd server
npm start        # Inicia servidor
npm run dev      # Inicia com nodemon (desenvolvimento)
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👤 Autor

**Christiano Leszkiewicz**
- GitHub: [@XSirch](https://github.com/XSirch)
- Email: 69818038+XSirch@users.noreply.github.com

## 🙏 Agradecimentos

- [Google Generative AI](https://ai.google.dev/) - IA integrada
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React](https://react.dev/) - Framework frontend
- [Express](https://expressjs.com/) - Framework backend
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
