# AIgenie Backend API

Backend API for AIgenie AI Content Generator built with Node.js, Express, PostgreSQL, and Ollama.

## Features

- User authentication (Signup/Signin) with JWT
- OAuth endpoints ready for Google/Facebook integration
- Text content generation (articles, blogs, descriptions, summaries)
- Marketing content generation (ads, slogans, social media, emails, SEO)
- Media content generation (captions, logo descriptions)
- Chat-based AI agent with conversation context
- Content history tracking

## Prerequisites

**For Local Development:**
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher, running locally or connection string)
- Ollama installed and running

**For Docker:**
- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)
- Ollama installed and running on host (or use Dockerized Ollama)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: aigenie)
- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - A secure random string for JWT signing
- `OLLAMA_BASE_URL` - Ollama service URL (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model name (default: llama2)

3. Install and set up Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (choose one)
ollama pull llama2
# or
ollama pull mistral

# Start Ollama service (usually runs automatically)
# Verify it's running:
curl http://localhost:11434/api/tags
```

4. Start PostgreSQL:
```bash
# If using local PostgreSQL
# macOS (with Homebrew)
brew services start postgresql@16

# Linux (Ubuntu/Debian)
sudo systemctl start postgresql

# Or use PostgreSQL connection details in .env
# Create database:
createdb aigenie
```

5. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000` (or your configured PORT).

## Docker Setup

The backend is fully dockerized and can be run with Docker Compose. This is the recommended way to run the application in production.

### Prerequisites for Docker

- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)
- Ollama installed and running on the host (for NLP generation)

### Quick Start with Docker

1. **Production Mode** (recommended):
   ```bash
   # Build and start all services (PostgreSQL + Backend)
   docker-compose up -d
   
   # View logs
   docker-compose logs -f backend
   
   # Stop services
   docker-compose down
   ```

2. **Development Mode** (with hot reload):
   ```bash
   # Start services in development mode
   docker-compose -f docker-compose.dev.yml up -d
   
   # View logs
   docker-compose -f docker-compose.dev.yml logs -f backend
   
   # Stop services
   docker-compose -f docker-compose.dev.yml down
   ```

### Docker Configuration

The `docker-compose.yml` includes:
- **PostgreSQL**: Containerized PostgreSQL database with persistent volume
- **Backend**: Node.js application with health checks

**Environment Variables** (can be set in `.env` or docker-compose.yml):
- `JWT_SECRET` - JWT signing secret (change in production!)
- `OLLAMA_BASE_URL` - Ollama service URL (default: `http://host.docker.internal:11434`)
- `OLLAMA_MODEL` - Model name (default: `llama2`)

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Execute commands in container
docker-compose exec backend sh

# Remove volumes (clean database)
docker-compose down -v
```

### Ollama Configuration for Docker

Since Ollama runs on the host machine, the backend container connects to it using `host.docker.internal:11434`. 

**For Linux**: You may need to add `extra_hosts` to docker-compose.yml:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

**Alternative**: Run Ollama in Docker (add to docker-compose.yml):
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: aigenie-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - aigenie-network
```

Then update `OLLAMA_BASE_URL` to `http://ollama:11434` in the backend service.

### Health Checks

Both services include health checks:
- PostgreSQL: Checks database connectivity
- Backend: Checks API health endpoint

View health status:
```bash
docker-compose ps
```

### Data Persistence

PostgreSQL data is persisted in a Docker volume (`postgres_data`). To backup:
```bash
docker-compose exec postgres pg_dump -U postgres aigenie > backup.sql
```

To restore:
```bash
docker-compose exec -T postgres psql -U postgres aigenie < backup.sql
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
  - Body: `{ email, username, password }`
  
- `POST /api/auth/signin` - Login user
  - Body: `{ username, password }`
  
- `GET /api/auth/me` - Get current user (protected)
  - Headers: `Authorization: Bearer <token>`
  
- `POST /api/auth/google` - Google OAuth (ready for frontend)
  - Body: `{ token, email, name }`
  
- `POST /api/auth/facebook` - Facebook OAuth (ready for frontend)
  - Body: `{ token, email, name }`
  
- `POST /api/auth/logout` - Logout (protected)

### Text Content

- `POST /api/text-content/generate` - Generate text content (protected)
  - Body: `{ prompt: string, contentType?: 'article' | 'blog' | 'description' | 'summary' }`

### Marketing Content

- `POST /api/marketing-content/generate` - Generate marketing content (protected)
  - Body: `{ prompt: string, type?: 'ad' | 'slogan' | 'social' | 'email' | 'seo' }`

### Media Content

- `POST /api/media-content/caption` - Generate captions (protected)
  - Body: `{ prompt?: string, imageDescription?: string }`
  
- `POST /api/media-content/text-to-image` - Text to image (not yet implemented)
  
- `POST /api/media-content/logo` - Generate logo description (protected)
  - Body: `{ prompt?: string, companyName?: string, style?: string }`

### Chat

- `POST /api/chat/message` - Send chat message (protected)
  - Body: `{ message: string, conversationId?: string }`
  
- `GET /api/chat/conversation/:conversationId` - Get conversation history (protected)

## API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Ollama Models

Recommended models for production:

1. **Llama 2 7B** - Good balance of quality and speed
   ```bash
   ollama pull llama2
   ```

2. **Mistral 7B** - Fast and efficient
   ```bash
   ollama pull mistral
   ```

3. **Llama 2 13B** - Better quality, slower (requires more RAM)
   ```bash
   ollama pull llama2:13b
   ```

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── services/        # External service integrations
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── .env.example         # Environment variables template
└── package.json
```

### Environment Variables

See `.env.example` for all available configuration options.

## Troubleshooting

### Ollama Connection Issues

If you get "Ollama service is not running" errors:

1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Start Ollama if not running:
   ```bash
   ollama serve
   ```

3. Verify the model is available:
   ```bash
   ollama list
   ```

### PostgreSQL Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   
   # Connect to PostgreSQL
   psql -U postgres -d aigenie
   ```

2. Check database connection details in `.env`

3. Ensure database exists:
   ```bash
   createdb aigenie
   ```

4. For remote PostgreSQL, ensure firewall allows connections on port 5432

## Next Steps

- [ ] Add rate limiting for subscription tiers
- [ ] Implement text-to-image generation (Stable Diffusion integration)
- [ ] Add content history API endpoints
- [ ] Implement OAuth token verification
- [ ] Add request logging and monitoring
- [ ] Set up production deployment configuration

## License

ISC

