# AI Persona Writer Backend

Production-ready Node.js backend for the AI Persona Writer application. Supports both **Minimal** and **Full** operation modes with comprehensive persona management, chat functionality, and optional server-side inference.

## 🚀 Features

### Core Functionality (Minimal Mode)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Persona CRUD**: Create, read, update, delete AI personas
- **Chat Storage**: Store and retrieve chat conversations
- **Share Links**: Generate shareable persona links with expiration
- **User Management**: User registration, profiles, and preferences
- **Analytics**: Basic usage tracking and statistics

### Advanced Features (Full Mode)
- **Server-side Inference**: Rule-based or TensorFlow.js persona response generation  
- **Admin Panel**: Moderation tools and advanced analytics
- **Content Filtering**: Automatic content moderation capabilities
- **Enhanced Analytics**: Detailed usage metrics and trends

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- Redis (optional, for caching)

## ⚡ Quick Start

1. **Clone and install dependencies:**
```bash
cd server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Seed demo data:**
```bash
npm run seed
```

4. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 🔧 Environment Configuration

### Required Variables
```env
# Database
MONGO_URI=mongodb://localhost:27017/ai-persona-writer

# Authentication  
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000
```

### Optional Variables
```env
# Server-side Inference Mode
INFER_MODE=off          # Options: off, rule, tfjs

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Redis Caching
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info          # error, warn, info, debug

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
```

## 🎯 API Endpoints

### Authentication
```bash
# Register new user
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com", 
  "password": "securepassword123"
}

# Get current user profile
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Personas
```bash
# Create persona (auth optional)
POST /api/personas
Authorization: Bearer <jwt_token>  # Optional
Content-Type: application/json
{
  "name": "TechGuru",
  "avatar": "💻",
  "tagline": "Coding the future with innovation!",
  "traits": ["Tech-Savvy", "Energetic", "Professional"],
  "tone": "professional",
  "formality": 0.7,
  "energy": 0.8,
  "emojiStyle": "💻 🚀 ⚡ 💡",
  "favoriteWords": ["innovation", "technology", "coding"],
  "signaturePhrases": ["Innovation at its finest!", "Let's optimize this!"],
  "seedText": "I'm a passionate software developer with over 10 years of experience...",
  "meta": {
    "visibility": "public",
    "tags": ["technology", "programming"]
  }
}

# List personas with filtering
GET /api/personas?page=1&limit=20&visibility=public&featured=true&search=tech

# Get single persona
GET /api/personas/:id

# Update persona (owner only)
PUT /api/personas/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "name": "UpdatedTechGuru",
  "meta": { "visibility": "private" }
}

# Delete persona (owner only) 
DELETE /api/personas/:id
Authorization: Bearer <jwt_token>
```

### Chat & Sharing
```bash
# Add chat message
POST /api/personas/:id/chat
Content-Type: application/json
{
  "sender": "user",
  "text": "Hello, tell me about yourself!",
  "serverReply": true  # Request server-generated response (Full mode only)
}

# Get chat history
GET /api/personas/:id/chat?sessionId=session_123&page=1&limit=50

# Create share link
POST /api/personas/:id/share
Authorization: Bearer <jwt_token>  # Optional

# Access shared persona
GET /s/:shareToken

# Export persona data
GET /api/personas/:id/export
```

### Admin (Admin role required)
```bash
# Get platform statistics
GET /api/admin/stats
Authorization: Bearer <admin_jwt_token>

# List all personas for moderation
GET /api/admin/personas?page=1&flagged=true

# Update persona moderation status
PATCH /api/admin/personas/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
{
  "visibility": "public",
  "featured": true,
  "moderatorNote": "Approved for public listing"
}

# Manage users
GET /api/admin/users?search=john&active=true
PATCH /api/admin/users/:id
```

## 📦 Deployment

### Heroku Deployment

1. **Create Heroku app:**
```bash
heroku create your-app-name
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev
```

2. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set CLIENT_URL=https://your-frontend.herokuapp.com
heroku config:set INFER_MODE=rule
```

3. **Deploy:**
```bash
git push heroku main
heroku run npm run seed
```

### DigitalOcean App Platform

1. **Create `app.yaml`:**
```yaml
name: ai-persona-writer-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/ai-persona-writer
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-jwt-secret-here
  - key: MONGO_URI
    value: your-mongodb-atlas-uri
databases:
- name: personas-db
  engine: MONGODB
```

2. **Deploy via GitHub integration or CLI**

### Docker Deployment

1. **Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
USER node
CMD ["npm", "start"]
```

2. **Build and run:**
```bash
docker build -t ai-persona-writer-backend .
docker run -p 5000:5000 --env-file .env ai-persona-writer-backend
```

### MongoDB Atlas Setup

1. **Create cluster** at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Whitelist IP addresses** (0.0.0.0/0 for development)
3. **Create database user** with read/write permissions
4. **Get connection string**: `mongodb+srv://username:password@cluster.mongodb.net/ai-persona-writer`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Goals
- **Unit Tests**: >80% coverage for controllers and utilities
- **Integration Tests**: All API endpoints tested
- **Authentication**: JWT validation and user permissions
- **Data Validation**: Input sanitization and validation

## 📊 Monitoring & Maintenance

### Performance Monitoring
- **Response Times**: Monitor API endpoint latency
- **Database Queries**: Optimize slow MongoDB operations  
- **Memory Usage**: Track Node.js memory consumption
- **Error Rates**: Monitor 4xx/5xx response rates

### Scaling Considerations
- **Horizontal Scaling**: Add more server instances behind load balancer
- **Database Sharding**: Partition persona data by user regions
- **CDN Integration**: Cache static assets and public personas
- **Redis Clustering**: Scale session and cache storage

### Security Best Practices
- **Regular Updates**: Keep dependencies updated
- **SSL/TLS**: Always use HTTPS in production
- **Rate Limiting**: Prevent abuse with appropriate limits  
- **Input Validation**: Sanitize all user inputs
- **Monitoring**: Log and alert on suspicious activity

## 📝 Development

### Code Structure
```
src/
├── controllers/     # Request handlers
├── middleware/      # Authentication, error handling
├── models/         # MongoDB schemas
├── routes/         # API route definitions  
├── utils/          # Helper functions
├── tests/          # Unit and integration tests
└── config/         # Configuration files
```

### Adding New Features

1. **Create model** in `src/models/`
2. **Add controller** in `src/controllers/`
3. **Define routes** in `src/routes/`
4. **Write tests** in `src/tests/`
5. **Update documentation**

### Database Migrations

For schema changes, create migration scripts:
```javascript
// migrations/001_add_persona_categories.js
const Persona = require('../models/Persona.model');

async function up() {
  await Persona.updateMany({}, { 
    $set: { 'meta.category': 'general' } 
  });
}

async function down() {
  await Persona.updateMany({}, { 
    $unset: { 'meta.category': '' } 
  });
}

module.exports = { up, down };
```

## 🔐 Security

### Authentication Flow
1. User registers with email/password
2. Password hashed with bcrypt (12 rounds)
3. JWT token issued with user claims
4. Token validated on protected routes
5. Optional refresh token for long sessions

### Data Protection
- **Encryption**: Passwords hashed with bcrypt
- **Sanitization**: MongoDB injection prevention
- **Validation**: Joi schema validation on inputs
- **Authorization**: Role-based access control

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes
- **User-specific**: 200 requests per hour per authenticated user

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MongoDB status
systemctl status mongod

# Verify connection string
node -e "console.log(process.env.MONGO_URI)"
```

**JWT Token Invalid**
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiration
jwt-cli decode $TOKEN
```

**High Memory Usage**
```bash
# Monitor memory usage
node --inspect src/index.js

# Profile with clinic.js
clinic doctor -- node src/index.js
```

### Error Codes
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Missing/invalid token
- **403**: Forbidden - Insufficient permissions  
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Unexpected error

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/) - Token debugging
- [Postman Collection](./postman_collection.json) - API testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Cost Estimates for 1000 users/day:**
- **Heroku**: ~$25-50/month (Hobby dyno + MongoDB addon)
- **DigitalOcean**: ~$15-30/month (Basic droplet + managed MongoDB)
- **AWS/Azure**: ~$20-40/month (EC2/App Service + Atlas)

For high-traffic applications, consider dedicated infrastructure and horizontal scaling strategies.

📖 Complete Project Documentation
•  Project Overview: Clear explanation of what the application does
•  Architecture Diagram: Visual representation of frontend, backend, and database
•  Feature Lists: Detailed breakdown of all capabilities
•  Technology Stack: Comprehensive tech details for both frontend and backend

🚀 Quick Start Guide
•  Prerequisites: All requirements clearly listed
•  Step-by-step Setup: For both frontend and backend
•  Configuration: Environment variables and settings
•  Access Instructions: URLs and endpoints

🏗️ Technical Deep Dive
•  Frontend Features: Advanced NLP engine, chat system, UI design
•  Backend Features: Authentication, persona management, admin dashboard
•  Database Schema: Complete model structures with field descriptions
•  API Endpoints: Full documentation with examples

🧪 Testing & Development
•  Testing Instructions: Frontend and backend testing procedures
•  API Testing: Complete cURL examples for all endpoints
•  Development Workflow: Git workflow, code quality, debugging

🚀 Deployment Guide
•  Frontend Deployment: Static hosting (Netlify, Vercel, GitHub Pages)
•  Backend Deployment: Heroku, Docker, DigitalOcean
•  Database Setup: MongoDB Atlas and local installation
•  Environment Configuration: Production settings

🛡️ Security & Performance
•  Security Best Practices: Authentication, data protection, API security
•  Performance Optimization: Frontend, backend, and database optimization
•  Monitoring: Health checks, logging, analytics

🆘 Troubleshooting
•  Common Issues: Frontend, backend, and deployment problems
•  Error Codes: HTTP status code explanations
•  Debugging Commands: Specific commands for diagnostics

🤝 Community & Support
•  Contributing Guidelines: How to contribute to the project
•  Development Setup: For contributors
•  Resources: Documentation links, learning materials
•  Contact Information: Support channels

📊 Key Highlights of the README:

1. Visual Architecture Diagram: Shows the relationship between components
2. Code Examples: Real API requests and responses
3. Complete File Structure: Shows every file and its purpose  
4. Environment Variables: Comprehensive configuration options
5. Deployment Scripts: Ready-to-use commands for multiple platforms
6. Database Schemas: Detailed model structures with validation rules
7. Security Checklist: Best practices for production deployment
8. Performance Metrics: Optimization strategies and monitoring
9. Error Handling: Comprehensive troubleshooting guide
10. Community Resources: Learning materials and support channels

This README serves as a complete guide for developers, users, and contributors. It provides everything needed to understand, set up, deploy, and maintain the AI Persona Writer application. The documentation is structured to be useful for both beginners getting started and experienced developers looking for specific technical details.
