# Plataforma de Eventos Corporativos

Uma solução completa e personalizável para transmissão de eventos ao vivo, vídeo sob demanda, e interação com audiência em tempo real. Sistema multi-idioma com painel administrativo robusto e recursos avançados de moderação e analytics.

## ✨ Recursos Principais

### 🎥 **Transmissão e Player**
- **Transmissões ao Vivo**: Suporte a HLS e YouTube Live
- **Vídeos Sob Demanda (VOD)**: Upload e reprodução de vídeos gravados
- **Multi-Idiomas**: Streams simultâneos em Português, Inglês e Espanhol
- **Player Adaptativo**: Interface responsiva com controles intuitivos
- **Thumbnails Personalizados**: Preview visual para cada transmissão

### 💬 **Interação em Tempo Real**
- **Chat ao Vivo**: 
  - Mensagens em tempo real via WebSocket
  - Modo Global ou por Transmissão
  - Moderação automática e manual
  - Destaque de mensagens importantes
  - Emojis e badges para moderadores
- **Enquetes Interativas**:
  - Criação multi-idioma (automática via idioma do stream)
  - Exibição de resultados em tempo real
  - Suporte a múltiplas opções
  - Analytics detalhado de votação
- **Sistema de Perguntas**:
  - Envio de perguntas pela audiência
  - Exibição em tela (global ou por idioma)
  - Moderação administrativa
- **Comentários**:
  - Sistema de comentários moderados
  - Aprovação antes de exibição
  - Título e descrição para cada comentário
- **Reações**:
  - Like/Dislike nas transmissões
  - Visualização em tempo real dos feedbacks

### 🎯 **Painel Administrativo Completo**

#### **Dashboard e Analytics**
- Visualizadores em tempo real
- Gráficos históricos de audiência
- Métricas de engajamento (mensagens, reações, votos)
- Exportação de relatórios em Excel
- Logs de sessão de usuários

#### **Gestão de Mídia**
- Upload de vídeos e posters
- Configuração de streams por idioma
- Armazenamento no MinIO (S3-compatible)
- Organização de transmissões ativas/finalizadas

#### **Moderação Avançada**
- **Chat**:
  - Aprovação/rejeição de mensagens pendentes
  - Banimento de usuários
  - Exclusão de mensagens
  - Destaque de mensagens importantes
  - Tabs separadas: Pendentes / Aprovadas / Histórico Completo
- **Perguntas**: Aprovação e exibição controlada
- **Comentários**: Moderação prévia antes de publicação
- **Feedback em Tempo Real**: Notificações para usuários banidos/mensagens deletadas

#### **Gestão de Usuários**
- CRUD completo de usuários
- Importação em massa via Excel
- Exportação de base de usuários
- Ativação/desativação de contas
- Gerenciamento de roles (Admin/Moderador/User)

#### **Configuração do Evento**
- **Branding**:
  - Upload de logo do evento
  - Upload de papel de parede (tela de login)
  - Nome do evento customizável
- **Autenticação**:
  - Campos personalizados no cadastro
  - Suporte a 2FA (Autenticação de Dois Fatores)
  - Controle de registro (aberto/fechado)
- **Recursos Habilitáveis**:
  - Toggle de Chat (Global/Por Stream)
  - Toggle de Enquetes
  - Toggle de Perguntas
  - Toggle de Comentários
  - Moderação opcional para cada recurso

#### **Relatórios de Interações**
- **Relatório de Reações**: Histórico de likes/dislikes por usuário
- **Relatório de Votos**: Detalhamento completo das votações em enquetes
- **Relatório de Perguntas**: Lista de todas as perguntas enviadas
- Busca e filtros avançados
- Exportação individual para Excel

#### **⚠️ Danger Zone**
- **Resetar Evento**: Limpa toda a base de dados do evento
  - Remove: usuários (exceto admins), mensagens, enquetes, perguntas, comentários, reações
  - Preserva: configurações, logo, streams
  - Dupla confirmação via modal customizado

### 🌍 **Experiência do Usuário**

- **Multi-Idioma**: Interface adaptável em PT/EN/ES
- **Notificações em App**: 
  - Novas enquetes
  - Novas perguntas exibidas
  - Mensagens do sistema
- **Tema Dark/Light**: Alternância de tema com persistência
- **Responsivo**: Interface mobile-first otimizada
- **Player Focado**: Modo sem distrações quando recursos são desabilitados

## 🏗️ Arquitetura

### **Backend (Controller → Service → Repository)**
```
api/
├── src/
│   ├── config/          # Configurações (DB, MinIO)
│   ├── controllers/     # Camada HTTP (request/response)
│   ├── services/        # Lógica de negócio
│   ├── repositories/    # Acesso aos dados (SQL)
│   ├── routes/          # Definição de rotas REST
│   ├── middleware/      # Auth, CORS, Upload
│   └── server.js        # Entry point + Socket.IO
├── scripts/
│   ├── migrations/      # Scripts de migração do BD
│   └── utilities/       # Ferramentas de debug
└── uploads/             # Storage temporário
```

### **Frontend (React + Zustand)**
```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/       # Componentes do painel admin
│   │   ├── player/      # Player e recursos interativos
│   │   └── ...          # Componentes gerais
│   ├── pages/           # Login, Player, Admin
│   ├── store/           # Estado global (Zustand)
│   ├── services/        # API client (Axios)
│   └── App.jsx          # Roteamento principal
└── public/              # Assets estáticos
```

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** v18+ / Express.js
- **PostgreSQL** (dados relacionais)
- **MinIO** (object storage S3-compatible)
- **Socket.IO** (WebSocket para real-time)
- **JWT** + Bcrypt (autenticação)
- **Nodemailer** (envio de emails 2FA)
- **Multer** (upload de arquivos)

### Frontend
- **React** v19 / Vite
- **TailwindCSS** v4 (estilização)
- **Zustand** (gerenciamento de estado)
- **React Player** (player de vídeo)
- **Recharts** (gráficos de analytics)
- **XLSX** (exportação de Excel)
- **Lucide React** (ícones)
- **React Toastify** (notificações)

### Infraestrutura
- **Docker Compose** (PostgreSQL + MinIO)

## 🚀 Como Executar

### Pré-requisitos
- Node.js v18+
- Docker e Docker Compose
- npm ou yarn

### 1. Iniciar Infraestrutura
```bash
docker-compose up -d
```
*Inicia PostgreSQL (porta 5432) e MinIO (portas 9000/9001)*

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` no diretório `/api`:

```bash
cd api
cp .env.example .env
```

Edite o arquivo `.env` com as seguintes variáveis:

```env
# Database Configuration
DB_USER=admin                    # Usuário do PostgreSQL
DB_HOST=localhost                # Host do banco (use 'localhost' local, IP/domínio em produção)
DB_NAME=events_db                # Nome do banco de dados
DB_PASSWORD=admin123             # Senha do banco (ALTERE em produção!)
DB_PORT=5432                     # Porta do PostgreSQL

# MinIO Configuration
MINIO_ENDPOINT=localhost         # Endpoint do MinIO
MINIO_PORT=9000                  # Porta da API do MinIO
MINIO_USE_SSL=false              # Use 'true' em produção com HTTPS
MINIO_ACCESS_KEY=minioadmin      # Access Key do MinIO (ALTERE em produção!)
MINIO_SECRET_KEY=minioadmin      # Secret Key do MinIO (ALTERE em produção!)
MINIO_PUBLIC_HOST=localhost      # Host público para acesso via browser

# Authentication
JWT_SECRET=your_super_secret_key_123   # Chave secreta para JWT (GERAR NOVA em produção!)
```

**⚠️ IMPORTANTE - Produção:**
- Altere `DB_PASSWORD` para uma senha forte
- Altere `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`
- Gere um `JWT_SECRET` único: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Configure `MINIO_USE_SSL=true` e use domínio com HTTPS

### 3. Configurar Backend
```bash
cd api
npm install
npm run dev
```
*API rodará em `http://localhost:3000`*

### 4. Configurar Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend rodará em `http://localhost:5173`*

## 🔐 Acesso Inicial

### Credenciais Padrão
- **Admin**: `admin` / `123`
- **User**: `user` / `123`
- **MinIO Console**: `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin`)

### Primeiros Passos
1. Acesse `http://localhost:5173`
2. Login como admin
3. Configure o evento em **Configuração**:
   - Defina nome e logo do evento
   - Configure idiomas das transmissões
   - Habilite/desabilite recursos
4. Adicione streams em **Mídia**
5. Crie enquetes, perguntas e gerencie usuários!

## 📊 Recursos Adicionais

### Moderação
- Acesso de **Moderadores** aos recursos: Chat e Recursos (Enquetes/Perguntas/Comentários)
- Moderadores não têm acesso a: Dashboard, Usuários, Mídia, Configuração

### Scoping de Chat
- **Global**: Mensagens visíveis em todas as transmissões
- **Por Transmissão**: Mensagens isoladas por idioma/stream

### Notificações
- Sistema de notificações em app para:
  - Novas enquetes disponíveis
  - Perguntas sendo exibidas em tela
  - Ações de moderação (banimento, mensagens deletadas)

## 📄 Licença

Este projeto está sob licença MIT.

## 🤝 Contribuições

Contribuições, issues e feature requests são bem-vindos!

---

**Desenvolvido com ❤️ para eventos corporativos memoráveis**
