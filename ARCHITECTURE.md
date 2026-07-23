# SpunkyAI - Architecture & Development Guide

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Discord.js Client                      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────┐      ┌────▼────┐      ┌────▼────┐
    │Commands │      │ Events  │      │   AI    │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
    ┌────▼────┬───────┬──▼───┬────────┬──▼────┐
    │Moderation│Server │Logging│Giveaway│AutoMod│
    │ Tickets  │Config │Welcome│Backups │Invites│
    └────┬────┴───────┴──┬────┴────────┴──┬───┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                    ┌─────▼──────┐
                    │  Prisma    │
                    │   (ORM)    │
                    └─────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌────▼────┐    ┌────▼────┐
    │SQLite   │      │PostgreSQL│    │ Firebase│
    │(Dev)    │      │(Prod)    │    │(Optional)│
    └─────────┘      └──────────┘    └─────────┘
```

## 🗂️ Folder Structure Explained

```
src/
├── ai/                    # AI Interpreter & Services
│   ├── interpreter.ts     # OpenAI integration
│   ├── geminiInterpreter.ts  # Gemini integration
│   └── aiService.ts       # Unified AI interface
│
├── commands/              # Command System
│   ├── baseCommand.ts     # Base command class
│   ├── commandManager.ts  # Command registration & execution
│   ├── defaultCommands.ts # ?ping, ?ask, ?help
│   └── utilityCommands.ts # ?giveaway, ?ticket, ?minecraft
│
├── events/                # Discord Event Handlers
│   ├── botEvents.ts       # Client ready, guild join/leave
│   ├── messageEvents.ts   # Message handling & command router
│   └── loggingEvents.ts   # Audit logging
│
├── moderation/            # Moderation Features
│   ├── moderationService.ts  # Ban, kick, warn, lock
│   └── modCommands.ts     # ?ban, ?warn, ?kick
│
├── server/                # Server Management
│   ├── expressServer.ts   # Health check endpoints
│   └── serverManagementService.ts  # Role/channel management
│
├── logging/               # Logging & Welcome System
│   ├── logger.ts          # Winston logger setup
│   ├── loggingEvents.ts   # Message/member/role logs
│   ├── welcomeEvents.ts   # Welcome/goodbye messages
│   ├── welcomeService.ts  # Welcome configuration
│   ├── eventInitializer.ts # Initialize all events
│   └── loggingCommands.ts # ?setupwelcome, ?setuplogs
│
├── database/              # Database Layer
│   ├── prisma.ts          # Prisma client singleton
│   ├── guildService.ts    # Guild CRUD operations
│   └── memberService.ts   # Member CRUD & warnings
│
├── config/                # Configuration
│   └── config.ts          # Environment variables
│
├── utils/                 # Utilities
│   ├── types.ts           # TypeScript interfaces
│   ├── validation.ts      # Input validation & parsing
│   ├── permissions.ts     # Permission checking
│   └── rateLimiter.ts     # Rate limiting & cooldowns
│
├── giveaways/             # Giveaway System
│   └── giveawayService.ts
│
├── tickets/               # Support Tickets
│   └── ticketService.ts
│
├── backup/                # Server Backups
│   └── backupService.ts
│
├── invites/               # Invite Tracking
│   └── inviteService.ts
│
├── automod/               # Auto-Moderation
│   └── autoModService.ts
│
├── scheduler/             # Event Scheduling
│   └── schedulerService.ts
│
├── minecraft/             # Minecraft Integration
│   └── minecraftService.ts
│
└── index.ts               # Entry point
```

## 🔄 Request Flow

### Prefix Command (`?ping`)

```
1. User sends: ?ping
   ↓
2. messageEvents.ts detects prefix
   ↓
3. commandManager.handleMessage() called
   ↓
4. Command lookup & permission check
   ↓
5. Execute pingCommand.execute()
   ↓
6. Reply with latency
```

### AI Command (`?ask hello`)

```
1. User sends: ?ask hello
   ↓
2. askCommand.execute() called
   ↓
3. aiService.processUserMessage() called
   ↓
4. AI Provider (OpenAI/Gemini) processes
   ↓
5. Store in AIConversation table
   ↓
6. Reply to user
```

### Moderation (`?ban @user spam`)

```
1. User sends: ?ban @user spam
   ↓
2. banCommand requires confirmation
   ↓
3. User confirms
   ↓
4. moderationService.banUser() called
   ↓
5. Discord API ban applied
   ↓
6. ModAction logged in database
   ↓
7. Reply with confirmation
```

## 🗄️ Database Schema Highlights

### Guild (Server Settings)

```prisma
model Guild {
  id: String                # Discord guild ID
  prefix: String            # Command prefix (?)
  aiEnabled: Boolean        # AI features enabled
  loggingEnabled: Boolean   # Audit logging enabled
  logChannelId: String?     # Where to send logs
  // ... relationships to roles, members, etc
}
```

### AIConversation (Store AI chats)

```prisma
model AIConversation {
  id: String
  guildId: String
  userId: String
  userMessage: String       # What user said
  botResponse: String       # Bot's response
  tokens: Int               # Token usage
  provider: String          # openai or gemini
  model: String             # gpt-3.5-turbo etc
  createdAt: DateTime
}
```

### Giveaway (Giveaway Tracking)

```prisma
model Giveaway {
  id: String
  guildId: String
  prize: String
  endsAt: DateTime          # When giveaway ends
  participants: GiveawayParticipant[]
  winners: GiveawayWinner[]
}
```

## 🔐 Permission System

```typescript
// Check if member has permission
const canBan = await PermissionValidator.checkMemberPermission(
  member,
  PermissionFlagsBits.BanMembers
);

// Check if bot can execute action
const botCanDelete = await PermissionValidator.checkBotPermission(
  guild,
  PermissionFlagsBits.ManageChannels
);

// Verify hierarchy (can't ban admins)
const canModerate = await PermissionValidator.canModerate(moderator, target);
```

## 🚀 Extending with New Features

### Add New Prefix Command

```typescript
// 1. Create in commands/newFeature.ts
export const newCommand: PrefixCommand = {
  name: "newcmd",
  description: "Does something cool",
  category: "utility",
  aliases: ["nc"],
  cooldown: 3,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message, args) => {
    await message.reply("Hello!");
  },
};

// 2. Register in index.ts
commandManager.register(newCommand);
```

### Add New Service

```typescript
// 1. Create src/myfeature/myService.ts
export class MyService {
  async doSomething(): Promise<void> {
    // Implementation
  }
}

export const myService = new MyService();

// 2. Use in commands
import { myService } from "../myfeature/myService";

await myService.doSomething();
```

### Add New Database Model

```prisma
// 1. Edit prisma/schema.prisma
model MyModel {
  id        String   @id
  guildId   String
  data      String
  createdAt DateTime @default(now())
}

// 2. Run migration
npm run prisma:migrate

// 3. Use in code
const result = await prisma.myModel.create({
  data: { id: uuidv4(), guildId, data }
});
```

## 🧪 Testing Locally

```bash
# Start in dev mode
npm run dev

# In Discord, try:
?ping
?ask What is 2+2?
?help
?warn @testuser test reason
```

## 📊 Performance Considerations

- **Rate Limiting**: 5 commands per 60 seconds per user
- **Database Queries**: Indexed on guildId, userId for fast lookups
- **AI Token Limit**: 2048 tokens max per response
- **Message Purge**: Max 100 at once (Discord limit)
- **Memory**: Conversation history capped at 10 messages

## 🔍 Debugging

```typescript
// Enable debug logging
process.env.LOG_LEVEL = "debug";

// View database queries
// Winston logs all database operations to logs/combined.log

// Check specific command
const cmd = commandManager.getCommand("ping");
console.log(cmd);
```

## 🌟 Key Design Patterns

1. **Singleton Pattern**: `prisma`, `aiInterpreter`, `commandManager`
2. **Service Pattern**: `GuildService`, `ModerationService`
3. **Factory Pattern**: `AIInterpreter` decides provider
4. **Command Pattern**: `PrefixCommand` interface
5. **Observer Pattern**: Discord event listeners

---

**For more info, see [DEPLOYMENT.md](DEPLOYMENT.md)**
