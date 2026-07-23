# 🚀 SpunkyAI Bot - Setup & Deployment Guide

## 📋 Prerequisites

- Node.js 22.0.0+
- npm 10.0.0+
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- OpenAI API Key OR Google Gemini API Key
- PostgreSQL 12+ (for production) or SQLite (for development)

## 🔧 Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/meethharsiddhi-ui/SpunkyAi.git
cd SpunkyAi
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required
DISCORD_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here

# Optional
GEMINI_API_KEY=your_key_here
BOT_OWNER_ID=your_user_id
DEV_GUILD_ID=your_server_id
AI_PROVIDER=openai  # or gemini
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Create initial migration
npm run prisma:migrate

# (Optional) Open Prisma Studio for data exploration
npm run prisma:studio
```

### 4. Development

```bash
# Watch mode with hot reload
npm run dev

# Or build & run
npm run build
npm start
```

## 🌐 Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npm run prisma:generate

CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  bot:
    build: .
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/spunkyai
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=spunkyai
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose up -d
```

## 🚀 Production Deployment

### Option 1: Railway.app

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Option 2: Heroku

```bash
# Create Procfile
echo "worker: npm start" > Procfile

# Deploy
git push heroku main
```

### Option 3: Self-hosted VPS

```bash
# SSH into server
ssh user@your-vps.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/meethharsiddhi-ui/SpunkyAi.git
cd SpunkyAi
npm install

# Setup PM2 for auto-restart
npm i -g pm2
pm2 start npm --name "spunkyai" -- start
pm2 save
pm2 startup
```

## 📊 Database Migration (SQLite → PostgreSQL)

### In production `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/spunkyai
```

### Run migration:

```bash
npm run prisma:deploy
```

## 🛠️ Available Commands

### Utility
- `?ping` - Check bot latency
- `?help` - Show all commands
- `?prefix [new-prefix]` - Change prefix

### AI
- `?ask [question]` - Ask SpunkyAI anything
- `?clear` - Clear conversation history

### Moderation
- `?warn @user [reason]` - Warn user
- `?ban @user [reason]` - Ban user (needs confirmation)
- `?kick @user [reason]` - Kick user
- `?mute @user [time]` - Timeout user
- `?lock [#channel]` - Lock channel
- `?unlock [#channel]` - Unlock channel
- `?purge [number]` - Delete messages
- `?warnings @user` - Show user warnings

### Server Management
- `?createrole <name> [color]` - Create role
- `?setupwelcome #channel message` - Setup welcome
- `?setuplogs #channel` - Setup logging

### Giveaways
- `?giveaway #channel prize duration [winners]` - Create giveaway

### Other
- `?ticket [reason]` - Create support ticket
- `?backup create` - Backup server
- `?backup list` - List backups
- `?minecraft <host> [port] [java|bedrock]` - Check MC server
- `?invites` - Show invite leaderboard

## 🔐 Security Best Practices

1. **Never commit `.env` files**
2. **Use strong bot token** - Rotate if exposed
3. **Enable 2FA** on Discord Developer account
4. **Validate all AI requests** - Bot prevents prompt injection
5. **Use PostgreSQL** in production
6. **Enable audit logging** - Track all mod actions
7. **Set up rate limiting** - Prevent abuse
8. **Regular backups** - Use `?backup create`

## 🐛 Troubleshooting

### Bot not responding

```bash
# Check token is correct
echo $DISCORD_TOKEN

# Verify bot has proper intents in Developer Portal
# Required: MESSAGE_CONTENT, GUILD_MEMBERS, GUILDS, DIRECT_MESSAGES
```

### Database connection error

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# For PostgreSQL:
# postgresql://user:password@host:5432/dbname

# For SQLite:
# file:./prisma/dev.db
```

### AI not responding

```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Check API quota and rate limits
# Visit: https://platform.openai.com/account/usage/overview
```

## 📈 Monitoring & Logs

### Local logs

```bash
ls logs/
cat logs/combined.log
cat logs/error.log
```

### Health check endpoint

```bash
curl http://localhost:3000/health
```

## 📚 API Documentation

### Health Check

```
GET /health
Response: { status: "healthy", uptime: 1234.56 }
```

### Bot Status

```
GET /status
Response: { status: "running", environment: "production", port: 3000 }
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- 📧 Email: support@spunkyai.dev
- 💬 Discord: [Join Server](https://discord.gg/spunkyai)
- 🐛 Issues: [GitHub Issues](https://github.com/meethharsiddhi-ui/SpunkyAi/issues)

---

**Made with ❤️ by SpunkyAI Team**
