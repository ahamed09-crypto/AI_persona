const mongoose = require('mongoose');
const User = require('./models/User.model');
const Persona = require('./models/Persona.model');
const ChatMessage = require('./models/ChatMessage.model');
const ShareToken = require('./models/ShareToken.model');
const { generateShareToken, generateSessionId, createExpirationDate } = require('./utils/tokenGenerator');
const logger = require('./utils/logger');

require('dotenv').config();

// Demo user data
const demoUsers = [
  {
    email: 'admin@aiersonawriter.com',
    passwordHash: 'admin123', // Will be hashed by pre-save middleware
    name: 'Admin User',
    roles: ['admin', 'user']
  },
  {
    email: 'demo@example.com',
    passwordHash: 'demo123',
    name: 'Demo User',
    roles: ['user']
  }
];

// Demo persona data
const demoPersonas = [
  {
    name: 'TechGuru',
    avatar: '💻',
    tagline: 'Coding the future with unstoppable innovation!',
    traits: ['Tech-Savvy', 'Energetic', 'Professional', 'Optimistic'],
    tone: 'professional',
    formality: 0.7,
    energy: 0.8,
    emojiStyle: '💻 🚀 ⚡ 🔧 💡 🖥️',
    favoriteWords: ['innovation', 'technology', 'coding', 'future', 'digital', 'software'],
    signaturePhrases: [
      'Innovation at its finest!',
      'Technology makes everything possible!',
      'Let\'s optimize this!',
      'The future is here!'
    ],
    seedText: 'I\'m a passionate software developer with over 10 years of experience building innovative solutions. I love exploring cutting-edge technologies and helping teams optimize their development processes. My expertise spans full-stack development, cloud architecture, and DevOps practices. I believe technology should make life better for everyone.',
    analysisData: {
      wordCount: 45,
      sentenceCount: 4,
      sentiment: { polarity: 'positive', strength: 0.8 },
      topics: ['technology', 'business'],
      vocabularyRichness: 0.75
    },
    meta: {
      visibility: 'public',
      featured: true,
      tags: ['technology', 'programming', 'innovation']
    }
  },
  {
    name: 'ArtMuse',
    avatar: '🎨',
    tagline: 'Turning imagination into reality with boundless creativity!',
    traits: ['Creative', 'Energetic', 'Expressive', 'Optimistic'],
    tone: 'creative',
    formality: 0.3,
    energy: 0.9,
    emojiStyle: '🎨 ✨ 🌈 🎭 💫 🦋',
    favoriteWords: ['creative', 'imagination', 'artistic', 'beautiful', 'inspire', 'dream'],
    signaturePhrases: [
      'Creativity is everything!',
      'Let\'s think outside the box!',
      'That\'s so creative!',
      'Art makes life beautiful!'
    ],
    seedText: 'I\'m a creative soul who finds inspiration everywhere! I love painting, digital art, and exploring new forms of artistic expression. Colors and textures speak to me in ways words cannot. I believe everyone has an artist within them waiting to be discovered. Let\'s create something amazing together!',
    analysisData: {
      wordCount: 42,
      sentenceCount: 5,
      sentiment: { polarity: 'positive', strength: 0.9 },
      topics: ['creativity', 'lifestyle'],
      vocabularyRichness: 0.8
    },
    meta: {
      visibility: 'public',
      featured: true,
      tags: ['art', 'creativity', 'inspiration']
    }
  },
  {
    name: 'ZenMaster',
    avatar: '🧘',
    tagline: 'Creating meaningful connections with gentle wisdom.',
    traits: ['Calm', 'Thoughtful', 'Balanced', 'Wise'],
    tone: 'friendly',
    formality: 0.5,
    energy: 0.3,
    emojiStyle: '🧘 🌙 ☁️ 🍃 💙 🌊',
    favoriteWords: ['peaceful', 'balance', 'mindful', 'wisdom', 'serenity', 'harmony'],
    signaturePhrases: [
      'Let\'s think about this carefully.',
      'Balance is key.',
      'Find peace within.',
      'Wisdom comes from within.'
    ],
    seedText: 'I practice mindfulness and meditation daily, finding peace in simplicity. Life taught me that rushing leads nowhere meaningful. I enjoy quiet moments, deep conversations, and helping others find their center. True strength comes from inner calm and understanding.',
    analysisData: {
      wordCount: 35,
      sentenceCount: 4,
      sentiment: { polarity: 'positive', strength: 0.6 },
      topics: ['lifestyle', 'education'],
      vocabularyRichness: 0.7
    },
    meta: {
      visibility: 'public',
      featured: false,
      tags: ['mindfulness', 'wisdom', 'balance']
    }
  },
  {
    name: 'BizStrategist',
    avatar: '📊',
    tagline: 'Delivering excellence through strategic thinking.',
    traits: ['Professional', 'Strategic', 'Analytical', 'Moderate'],
    tone: 'professional',
    formality: 0.9,
    energy: 0.6,
    emojiStyle: '📊 📈 💼 🎯 ⚖️ 💡',
    favoriteWords: ['strategy', 'analysis', 'efficiency', 'optimization', 'growth', 'results'],
    signaturePhrases: [
      'Based on my experience...',
      'The optimal solution would be...',
      'Let\'s approach this systematically.',
      'Strategic thinking is key.'
    ],
    seedText: 'As a business strategist with 15 years of experience, I specialize in helping organizations optimize their operations and achieve sustainable growth. I believe in data-driven decision making and systematic approaches to problem-solving. My expertise includes market analysis, operational efficiency, and strategic planning.',
    analysisData: {
      wordCount: 38,
      sentenceCount: 3,
      sentiment: { polarity: 'positive', strength: 0.7 },
      topics: ['business'],
      vocabularyRichness: 0.85
    },
    meta: {
      visibility: 'public',
      featured: false,
      tags: ['business', 'strategy', 'analysis']
    }
  },
  {
    name: 'GameMaster',
    avatar: '🎮',
    tagline: 'Life\'s an adventure - let\'s play it to the max!',
    traits: ['Casual', 'Energetic', 'Fun', 'Expressive'],
    tone: 'casual',
    formality: 0.2,
    energy: 0.8,
    emojiStyle: '🎮 🕹️ 🎲 🏆 ⚡ 🔥',
    favoriteWords: ['awesome', 'epic', 'gaming', 'adventure', 'challenge', 'victory'],
    signaturePhrases: [
      'That\'s epic!',
      'Game on!',
      'Level up time!',
      'Achievement unlocked!'
    ],
    seedText: 'Hey gamers! I\'m totally obsessed with video games and always up for a good challenge. From retro classics to the latest AAA titles, I\'ve played them all! Love discussing game mechanics, speedrunning strategies, and discovering hidden gems. Gaming isn\'t just a hobby - it\'s a way of life! 🎮',
    analysisData: {
      wordCount: 45,
      sentenceCount: 5,
      sentiment: { polarity: 'positive', strength: 0.9 },
      topics: ['entertainment', 'lifestyle'],
      vocabularyRichness: 0.65
    },
    meta: {
      visibility: 'unlisted',
      featured: false,
      tags: ['gaming', 'entertainment', 'fun']
    }
  },
  {
    name: 'EcoWarrior',
    avatar: '🌱',
    tagline: 'Protecting our planet, one action at a time.',
    traits: ['Passionate', 'Thoughtful', 'Optimistic', 'Articulate'],
    tone: 'friendly',
    formality: 0.6,
    energy: 0.7,
    emojiStyle: '🌱 🌍 ♻️ 🌿 💚 🌳',
    favoriteWords: ['sustainable', 'environment', 'planet', 'green', 'renewable', 'conservation'],
    signaturePhrases: [
      'Every action counts!',
      'Think green, live clean!',
      'Our planet needs us!',
      'Sustainability is the future!'
    ],
    seedText: 'I\'m passionate about environmental conservation and sustainable living. Every day, I try to make choices that reduce my carbon footprint and inspire others to do the same. From renewable energy to zero-waste practices, I believe small actions can create massive positive change for our planet.',
    analysisData: {
      wordCount: 40,
      sentenceCount: 3,
      sentiment: { polarity: 'positive', strength: 0.8 },
      topics: ['lifestyle', 'education'],
      vocabularyRichness: 0.78
    },
    meta: {
      visibility: 'public',
      featured: false,
      tags: ['environment', 'sustainability', 'conservation']
    }
  }
];

// Demo chat messages
function generateDemoChatMessages(personaId, sessionId) {
  return [
    {
      personaId,
      sessionId,
      sender: 'persona',
      text: 'Hello! Great to meet you! Ready for an interesting conversation?',
      metadata: {
        responseTime: 850,
        model: 'rule',
        confidence: 0.9
      }
    },
    {
      personaId,
      sessionId,
      sender: 'user',
      text: 'Hi there! I\'d love to learn more about your interests.',
      metadata: {
        userAgent: 'Demo Browser',
        ipAddress: '127.0.0.1'
      }
    },
    {
      personaId,
      sessionId,
      sender: 'persona',
      text: 'That\'s fantastic! I love sharing what I\'m passionate about. What would you like to know?',
      metadata: {
        responseTime: 720,
        model: 'rule',
        confidence: 0.85
      }
    }
  ];
}

async function clearDatabase() {
  logger.info('Clearing existing data...');
  
  await Promise.all([
    User.deleteMany({}),
    Persona.deleteMany({}),
    ChatMessage.deleteMany({}),
    ShareToken.deleteMany({})
  ]);

  logger.info('Database cleared successfully');
}

async function seedUsers() {
  logger.info('Creating demo users...');
  
  const users = [];
  
  for (const userData of demoUsers) {
    const user = new User(userData);
    await user.save();
    users.push(user);
    logger.info(`Created user: ${user.email}`);
  }
  
  return users;
}

async function seedPersonas(users) {
  logger.info('Creating demo personas...');
  
  const personas = [];
  
  for (let i = 0; i < demoPersonas.length; i++) {
    const personaData = { ...demoPersonas[i] };
    
    // Assign ownership to demo users (some anonymous)
    if (i < 4) {
      personaData.ownerId = users[1]._id; // Demo user owns first 4
    } else if (i === 4) {
      personaData.ownerId = users[0]._id; // Admin owns one
    }
    // Last persona remains anonymous (no ownerId)
    
    const persona = new Persona(personaData);
    await persona.save();
    personas.push(persona);
    
    logger.info(`Created persona: ${persona.name}`);
  }
  
  return personas;
}

async function seedChatMessages(personas) {
  logger.info('Creating demo chat messages...');
  
  // Create chat messages for first 3 personas
  for (let i = 0; i < 3; i++) {
    const persona = personas[i];
    const sessionId = generateSessionId();
    const messages = generateDemoChatMessages(persona._id, sessionId);
    
    for (const messageData of messages) {
      const message = new ChatMessage(messageData);
      await message.save();
    }
    
    // Update persona chat stats
    await Persona.findByIdAndUpdate(persona._id, {
      $inc: { 'stats.chats': 1, 'stats.totalMessages': messages.length }
    });
    
    logger.info(`Created chat messages for ${persona.name}`);
  }
}

async function seedShareTokens(personas) {
  logger.info('Creating demo share tokens...');
  
  // Create share tokens for first 2 personas
  for (let i = 0; i < 2; i++) {
    const persona = personas[i];
    
    const shareToken = new ShareToken({
      personaId: persona._id,
      token: generateShareToken(),
      expiresAt: createExpirationDate(),
      visits: Math.floor(Math.random() * 20) + 1, // Random visits 1-20
      createdBy: persona.ownerId
    });
    
    await shareToken.save();
    
    // Update persona share stats
    await Persona.findByIdAndUpdate(persona._id, {
      $inc: { 'stats.shares': 1, 'stats.views': shareToken.visits }
    });
    
    logger.info(`Created share token for ${persona.name}: /s/${shareToken.token}`);
  }
}

async function updateUserStats(users, personas) {
  logger.info('Updating user statistics...');
  
  // Update demo user stats
  const demoUser = users[1];
  const userPersonas = personas.filter(p => p.ownerId && p.ownerId.toString() === demoUser._id.toString());
  
  demoUser.stats.personasCreated = userPersonas.length;
  demoUser.stats.chatsStarted = userPersonas.filter(p => p.stats.chats > 0).length;
  await demoUser.save();
  
  // Update admin user stats
  const adminUser = users[0];
  const adminPersonas = personas.filter(p => p.ownerId && p.ownerId.toString() === adminUser._id.toString());
  
  adminUser.stats.personasCreated = adminPersonas.length;
  adminUser.stats.chatsStarted = adminPersonas.filter(p => p.stats.chats > 0).length;
  await adminUser.save();
  
  logger.info('User statistics updated');
}

async function runSeed() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-persona-writer';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    const users = await seedUsers();
    const personas = await seedPersonas(users);
    await seedChatMessages(personas);
    await seedShareTokens(personas);
    await updateUserStats(users, personas);
    
    // Log summary
    logger.info('\n🎉 Seed completed successfully!');
    logger.info('\n📊 Summary:');
    logger.info(`👥 Users created: ${users.length}`);
    logger.info(`🎭 Personas created: ${personas.length}`);
    logger.info(`💬 Chat sessions: 3`);
    logger.info(`🔗 Share tokens: 2`);
    
    logger.info('\n🔑 Demo Accounts:');
    logger.info('Admin: admin@aiersonawriter.com / admin123');
    logger.info('User: demo@example.com / demo123');
    
    logger.info('\n🌟 Featured Personas:');
    personas.filter(p => p.meta.featured).forEach(p => {
      logger.info(`- ${p.name}: ${p.tagline}`);
    });
    
    logger.info('\nSeed script completed! 🚀');
    
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
}

// Run seed if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };