# Plataforma de Eventos Corporativos

Uma solução completa e personalizável para transmissão de eventos ao vivo, vídeo sob demanda, e interação com audiência em tempo real.

## 🚀 Funcionalidades Principais

### Para Participantes
- **Player de Vídeo**: Suporte a transmissões ao vivo (HLS/YouTube) e vídeos gravados (VOD).
- **Chat Interativo**: Chat em tempo real com emojis, badges para moderadores e suporte a mensagens do sistema.
- **Área do Usuário**: Login, cadastro e suporte a Autenticação de Dois Fatores (2FA).
- **Responsivo**: Interface adaptada para desktop e mobile.

### Para Administradores
- **Dashboard de Analytics**: Acompanhe métricas em tempo real (usuários online, mensagens) e exporte relatórios detalhados de audiência em Excel.
- **Gestão de Mídia**: Configure streams ao vivo, faça upload de vídeos e thumbnails (armazenados localmente ou no MinIO).
- **Moderação de Chat**: Ferramentas para banir usuários, apagar mensagens e destacar interações importantes.
- **Customização**:
  - Personalize o nome e logo do evento.
  - Defina campos personalizados no formulário de cadastro (CPF, Empresa, Cargo, etc.).
  - Configure o método de autenticação (Aberto, Padrão ou 2FA).
- **Gestão de Usuários**: Importe usuários em massa via Excel, edite perfis e gerencie permissões.

## 🛠️ Tecnologias Utilizadas

### Backend (`/api`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL
- **Armazenamento**: MinIO (Compatível com S3)
- **Real-time**: Socket.IO (Chat e Analytics)
- **Email**: Nodemailer (SMTP)
- **Autenticação**: JWT (JSON Web Tokens) & Bcrypt

### Frontend (`/frontend`)
- **Framework**: React.js 19
- **Build Tool**: Vite
- **Estilização**: TailwindCSS 4
- **Estado**: Zustand
- **Vídeo**: React Player
- **Gráficos**: Recharts
- **Formatação**: date-fns

### Infraestrutura
- **Docker Compose**: Orquestração dos serviços de banco de dados e armazenamento.

## 🏗️ Arquitetura

O projeto segue uma arquitetura cliente-servidor:
1.  **Frontend (SPA)**: Aplicação React que consome a API REST para dados e conecta via WebSocket para interações em tempo real.
2.  **API Gateway / Backend**: Servidor Node.js que gerencia regras de negócio, autenticação e proxy de eventos WebSocket.
3.  **Serviços de Dados**:
    - **PostgreSQL**: Persistência de usuários, logs de chat, configurações e sessões.
    - **MinIO**: Object Storage para vídeos, imagens e uploads em geral.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- Docker e Docker Compose

### Passo 1: Iniciar Serviços de Infraestrutura
Na raiz do projeto, suba o banco de dados e o MinIO:
```bash
docker-compose up -d
```
*Isso iniciará o PostgreSQL na porta 5432, o MinIO na 9000/9001 e criará os buckets necessários automaticamente via script.*

### Passo 2: Configurar Variáveis de Ambiente
O backend já possui um arquivo `.env` configurado para o ambiente local padrão. Caso precise alterar senhas ou portas, edite `/api/.env`.

### Passo 3: Executar a API (Backend)
Em um novo terminal:
```bash
cd api
npm install
npm run dev
```
*A API rodará em `http://localhost:3000`.*

### Passo 4: Executar a Aplicação (Frontend)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
*O Frontend rodará em `http://localhost:5173` (ou porta similar indicada).*

## 🔐 Acesso Inicial
- **Login Admin**: Cadastre um usuário via interface e altere sua role no banco de dados para `admin` ou use as credenciais padrão se houver seed (usuários: `admin`, senha: `123`).
- **MinIO Console**: Acesse `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin`).

## 📂 Estrutura de Pastas

```
/
├── api/                # Backend Node.js
│   ├── src/
│   │   ├── config/     # Conexões DB e MinIO
│   │   ├── controllers/# Lógica dos endpoints
│   │   ├── services/   # Regras de negócio
│   │   ├── models/     # Modelos de dados
│   │   └── routes/     # Definição de rotas da API
│   └── uploads/        # Pasta temporária/fallback para uploads locais
│
├── frontend/           # Frontend React
│   ├── src/
│   │   ├── components/ # Componentes UI reutilizáveis
│   │   ├── pages/      # Páginas principais (Admin, Player, Login)
│   │   └── store/      # Gerenciamento de estado (Zustand)
│
└── docker-compose.yml  # Configuração dos containers
```
