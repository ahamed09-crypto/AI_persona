/**
 * AI Persona Writer - Complete JavaScript Implementation
 * Features: Local NLP Analysis, Persona Generation, Chat Simulation, Data Persistence
 */

// Global State Management
class PersonaWriter {
    constructor() {
        this.currentPersona = null;
        this.savedPersonas = [];
        this.chatHistory = [];
        this.isAnalyzing = false;
        
        // Initialize the application
        this.init();
    }

    init() {
        this.loadSavedPersonas();
        this.bindEvents();
        this.setupDemoData();
        this.updateCharCounter();
    }

    // Event Binding
    bindEvents() {
        // Bio input events
        const bioInput = document.getElementById('bioInput');
        const generateBtn = document.getElementById('generateBtn');
        
        bioInput.addEventListener('input', () => {
            this.updateCharCounter();
            this.toggleGenerateButton();
        });
        
        generateBtn.addEventListener('click', () => this.generatePersona());

        // Demo bio buttons
        document.querySelectorAll('.demo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const demoType = e.target.dataset.demo;
                this.loadDemoBio(demoType);
            });
        });

        // Persona actions
        document.getElementById('savePersonaBtn')?.addEventListener('click', () => this.saveCurrentPersona());
        document.getElementById('startChatBtn')?.addEventListener('click', () => this.startChat());

        // Chat functionality
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        chatInput?.addEventListener('input', () => this.toggleSendButton());
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendBtn.disabled) {
                this.sendMessage();
            }
        });
        
        sendBtn?.addEventListener('click', () => this.sendMessage());

        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.dataset.message;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            });
        });

        // Chat controls
        document.getElementById('clearChatBtn')?.addEventListener('click', () => this.clearChat());
        document.getElementById('exportChatBtn')?.addEventListener('click', () => this.exportChat());
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAllPersonas());
    }

    // Demo Data Setup
    setupDemoData() {
        this.demoBios = {
            creative: "I'm a passionate writer who loves exploring new worlds through storytelling. My imagination runs wild with fantasy adventures and sci-fi concepts! I believe creativity is the key to solving any problem. When I'm not writing, I enjoy sketching characters and brainstorming plot twists. Life's too short for boring conversations - let's talk about dreams, art, and the magic in everyday moments! ✨",
            
            professional: "I'm a dedicated professional with over 8 years of experience in project management and team leadership. I value efficiency, clear communication, and strategic thinking. My approach focuses on delivering results while maintaining high standards of quality. I enjoy mentoring junior colleagues and optimizing workflows. I believe in data-driven decisions and continuous improvement. Outside of work, I appreciate good coffee and thoughtful business podcasts.",
            
            casual: "Hey there! I'm just your average person who loves hanging out with friends, binge-watching Netflix shows, and trying new food spots around town. I'm pretty laid-back and always up for a good laugh. Gaming is my jam - especially co-op games with buddies. I think life's better when you don't take things too seriously. Always down for spontaneous adventures or just chilling with some pizza! 🍕😄"
        };
    }

    // Character Counter Update
    updateCharCounter() {
        const bioInput = document.getElementById('bioInput');
        const charCount = document.getElementById('charCount');
        const currentLength = bioInput.value.length;
        
        charCount.textContent = currentLength;
        charCount.style.color = currentLength > 1800 ? 'var(--warning)' : 'var(--text-muted)';
    }

    // Toggle Generate Button State
    toggleGenerateButton() {
        const bioInput = document.getElementById('bioInput');
        const generateBtn = document.getElementById('generateBtn');
        const minLength = 50;
        
        generateBtn.disabled = bioInput.value.trim().length < minLength;
    }

    // Toggle Send Button State
    toggleSendButton() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        sendBtn.disabled = !chatInput.value.trim() || !this.currentPersona;
    }

    // Load Demo Bio
    loadDemoBio(type) {
        const bioInput = document.getElementById('bioInput');
        bioInput.value = this.demoBios[type];
        this.updateCharCounter();
        this.toggleGenerateButton();
        bioInput.focus();
    }

    // Core NLP Analysis Engine
    async generatePersona() {
        if (this.isAnalyzing) return;
        
        const bioText = document.getElementById('bioInput').value.trim();
        if (bioText.length < 50) {
            this.showToast('Please write at least 50 characters for better analysis.', 'warning');
            return;
        }

        this.isAnalyzing = true;
        this.showLoadingOverlay();
        
        try {
            // Simulate analysis time for better UX
            await this.delay(2000);
            
            const analysis = this.analyzeText(bioText);
            const persona = this.createPersona(analysis, bioText);
            
            this.currentPersona = persona;
            this.displayPersona(persona);
            this.showToast('Persona generated successfully!', 'success');
            
        } catch (error) {
            console.error('Persona generation error:', error);
            this.showToast('Error generating persona. Please try again.', 'error');
        } finally {
            this.isAnalyzing = false;
            this.hideLoadingOverlay();
        }
    }

    // Advanced Text Analysis
    analyzeText(text) {
        const tokens = this.tokenize(text);
        const sentences = this.splitSentences(text);
        
        return {
            // Basic metrics
            wordCount: tokens.length,
            sentenceCount: sentences.length,
            avgWordsPerSentence: tokens.length / sentences.length,
            
            // Sentiment analysis
            sentiment: this.analyzeSentiment(tokens),
            
            // Style analysis
            formality: this.analyzeFormality(text, tokens),
            energy: this.analyzeEnergy(text, tokens),
            
            // Content analysis
            topics: this.extractTopics(tokens),
            vocabulary: this.analyzeVocabulary(tokens),
            
            // Linguistic patterns
            punctuationStyle: this.analyzePunctuation(text),
            emojiUsage: this.analyzeEmojis(text),
            
            // Communication style
            questionRatio: this.analyzeQuestions(sentences),
            exclamationRatio: this.analyzeExclamations(sentences),
            
            // Original text for reference
            originalText: text
        };
    }

    // Tokenization
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    // Sentence Splitting
    splitSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    // Sentiment Analysis using lexicon approach
    analyzeSentiment(tokens) {
        const positiveWords = [
            'love', 'enjoy', 'amazing', 'awesome', 'great', 'excellent', 'wonderful',
            'fantastic', 'brilliant', 'incredible', 'perfect', 'beautiful', 'happy',
            'excited', 'passionate', 'thrilled', 'delighted', 'pleased', 'satisfied',
            'good', 'nice', 'cool', 'fun', 'interesting', 'fascinating', 'inspiring'
        ];
        
        const negativeWords = [
            'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing',
            'frustrated', 'annoyed', 'upset', 'angry', 'sad', 'depressed', 'boring',
            'stupid', 'difficult', 'problem', 'issue', 'concern', 'worry', 'fear'
        ];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        tokens.forEach(token => {
            if (positiveWords.includes(token)) positiveScore++;
            if (negativeWords.includes(token)) negativeScore++;
        });
        
        const netScore = positiveScore - negativeScore;
        const totalEmotional = positiveScore + negativeScore;
        
        if (totalEmotional === 0) return { polarity: 'neutral', strength: 0.3 };
        
        const strength = Math.min(totalEmotional / tokens.length * 10, 1);
        
        if (netScore > 0) return { polarity: 'positive', strength };
        if (netScore < 0) return { polarity: 'negative', strength };
        return { polarity: 'neutral', strength };
    }

    // Formality Analysis
    analyzeFormality(text, tokens) {
        const formalIndicators = [
            'furthermore', 'moreover', 'consequently', 'therefore', 'however',
            'nevertheless', 'approximately', 'significant', 'substantial', 'comprehensive',
            'expertise', 'professional', 'experience', 'responsibility', 'objective'
        ];
        
        const informalIndicators = [
            'yeah', 'cool', 'awesome', 'gonna', 'wanna', 'kinda', 'sorta',
            'hey', 'yo', 'dude', 'buddy', 'stuff', 'things', 'pretty',
            'really', 'super', 'totally', 'definitely', 'absolutely'
        ];
        
        const contractions = (text.match(/'(ll|re|ve|d|t|s)\b/g) || []).length;
        
        let formalScore = 0;
        let informalScore = 0;
        
        tokens.forEach(token => {
            if (formalIndicators.includes(token)) formalScore++;
            if (informalIndicators.includes(token)) informalScore++;
        });
        
        // Factor in sentence length and contractions
        const avgSentenceLength = tokens.length / this.splitSentences(text).length;
        const contractionsRatio = contractions / tokens.length;
        
        formalScore += avgSentenceLength > 20 ? 2 : 0;
        informalScore += contractionsRatio > 0.1 ? 3 : 0;
        
        const total = formalScore + informalScore;
        if (total === 0) return 0.5; // neutral
        
        return formalScore / total;
    }

    // Energy Level Analysis
    analyzeEnergy(text, tokens) {
        const highEnergyWords = [
            'excited', 'amazing', 'awesome', 'incredible', 'fantastic', 'brilliant',
            'love', 'passion', 'adventure', 'explore', 'discover', 'create',
            'energy', 'dynamic', 'vibrant', 'enthusiastic', 'motivated'
        ];
        
        const lowEnergyWords = [
            'calm', 'quiet', 'peaceful', 'relaxed', 'gentle', 'soft', 'subtle',
            'comfortable', 'steady', 'stable', 'consistent', 'methodical'
        ];
        
        const exclamations = (text.match(/!/g) || []).length;
        const capitalWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
        
        let energyScore = 0;
        
        tokens.forEach(token => {
            if (highEnergyWords.includes(token)) energyScore += 2;
            if (lowEnergyWords.includes(token)) energyScore -= 1;
        });
        
        energyScore += exclamations * 2;
        energyScore += capitalWords;
        
        // Normalize to 0-1 scale
        return Math.max(0, Math.min(1, (energyScore + tokens.length * 0.3) / (tokens.length * 0.8)));
    }

    // Topic Extraction
    extractTopics(tokens) {
        const topicKeywords = {
            technology: ['tech', 'computer', 'software', 'programming', 'code', 'digital', 'ai', 'data'],
            creativity: ['creative', 'art', 'design', 'music', 'writing', 'imagination', 'artistic'],
            business: ['business', 'management', 'leadership', 'strategy', 'marketing', 'finance'],
            lifestyle: ['travel', 'food', 'fitness', 'health', 'family', 'friends', 'hobbies'],
            entertainment: ['movies', 'games', 'books', 'tv', 'sports', 'music', 'shows'],
            education: ['learning', 'education', 'teaching', 'study', 'knowledge', 'research']
        };
        
        const topicScores = {};
        
        Object.keys(topicKeywords).forEach(topic => {
            topicScores[topic] = 0;
            topicKeywords[topic].forEach(keyword => {
                topicScores[topic] += tokens.filter(token => token.includes(keyword)).length;
            });
        });
        
        return Object.entries(topicScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .filter(([_, score]) => score > 0)
            .map(([topic, _]) => topic);
    }

    // Vocabulary Analysis
    analyzeVocabulary(tokens) {
        const uniqueWords = new Set(tokens);
        const vocabularyRichness = uniqueWords.size / tokens.length;
        
        const wordFreq = {};
        tokens.forEach(token => {
            wordFreq[token] = (wordFreq[token] || 0) + 1;
        });
        
        const frequentWords = Object.entries(wordFreq)
            .filter(([word, freq]) => freq > 1 && word.length > 3)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([word, _]) => word);
        
        return {
            richness: vocabularyRichness,
            frequentWords: frequentWords
        };
    }

    // Punctuation Analysis
    analyzePunctuation(text) {
        const punctuationCounts = {
            exclamation: (text.match(/!/g) || []).length,
            question: (text.match(/\?/g) || []).length,
            ellipsis: (text.match(/\.{2,}/g) || []).length,
            dash: (text.match(/--?/g) || []).length
        };
        
        const totalPunctuation = Object.values(punctuationCounts).reduce((a, b) => a + b, 0);
        const textLength = text.length;
        
        return {
            density: totalPunctuation / textLength,
            style: this.determinePunctuationStyle(punctuationCounts)
        };
    }

    determinePunctuationStyle(counts) {
        if (counts.exclamation > 2) return 'enthusiastic';
        if (counts.question > 2) return 'inquisitive';
        if (counts.ellipsis > 1) return 'contemplative';
        if (counts.dash > 1) return 'expressive';
        return 'standard';
    }

    // Emoji Analysis
    analyzeEmojis(text) {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojis = text.match(emojiRegex) || [];
        
        const emojiFreq = {};
        emojis.forEach(emoji => {
            emojiFreq[emoji] = (emojiFreq[emoji] || 0) + 1;
        });
        
        return {
            count: emojis.length,
            unique: Object.keys(emojiFreq).length,
            favorites: Object.keys(emojiFreq).slice(0, 5),
            density: emojis.length / text.length
        };
    }

    // Question Analysis
    analyzeQuestions(sentences) {
        const questions = sentences.filter(s => s.includes('?')).length;
        return questions / sentences.length;
    }

    // Exclamation Analysis
    analyzeExclamations(sentences) {
        const exclamations = sentences.filter(s => s.includes('!')).length;
        return exclamations / sentences.length;
    }

    // Persona Creation
    createPersona(analysis, originalText) {
        const name = this.generatePersonaName(analysis);
        const traits = this.mapTraits(analysis);
        const phrases = this.generateSignaturePhrases(analysis, originalText);
        const emojiStyle = this.determineEmojiStyle(analysis);
        const avatar = this.selectAvatar(analysis);
        
        return {
            id: this.generateId(),
            name: name,
            avatar: avatar,
            tagline: this.generateTagline(analysis),
            traits: traits,
            signaturePhrases: phrases,
            favoriteWords: analysis.vocabulary.frequentWords.slice(0, 6),
            emojiStyle: emojiStyle,
            communicationStyle: {
                formality: analysis.formality,
                energy: analysis.energy,
                sentiment: analysis.sentiment.polarity,
                topics: analysis.topics
            },
            createdAt: new Date().toISOString(),
            analysisData: analysis
        };
    }

    // Generate Persona Name
    generatePersonaName(analysis) {
        const nameComponents = {
            prefixes: {
                high_energy: ['Spark', 'Blaze', 'Dash', 'Flash', 'Volt', 'Zap'],
                low_energy: ['Zen', 'Calm', 'Sage', 'Peace', 'Gentle', 'Quiet'],
                creative: ['Dream', 'Vision', 'Art', 'Muse', 'Pixel', 'Canvas'],
                professional: ['Pro', 'Elite', 'Prime', 'Expert', 'Alpha', 'Chief'],
                friendly: ['Buddy', 'Sunny', 'Happy', 'Joy', 'Bright', 'Cheer']
            },
            suffixes: {
                technology: ['Tech', 'Bot', 'Byte', 'Code', 'Data', 'Sync'],
                creativity: ['Art', 'Craft', 'Draw', 'Write', 'Make', 'Create'],
                business: ['Pro', 'Lead', 'Boss', 'Chief', 'Head', 'Star'],
                lifestyle: ['Life', 'Style', 'Vibe', 'Flow', 'Wave', 'Soul'],
                entertainment: ['Fun', 'Play', 'Game', 'Show', 'Joy', 'Laugh']
            }
        };
        
        let prefix = 'Neo';
        let suffix = 'Mind';
        
        // Choose prefix based on energy and personality
        if (analysis.energy > 0.7) {
            prefix = this.randomChoice(nameComponents.prefixes.high_energy);
        } else if (analysis.energy < 0.3) {
            prefix = this.randomChoice(nameComponents.prefixes.low_energy);
        } else if (analysis.topics.includes('creativity')) {
            prefix = this.randomChoice(nameComponents.prefixes.creative);
        } else if (analysis.formality > 0.7) {
            prefix = this.randomChoice(nameComponents.prefixes.professional);
        } else {
            prefix = this.randomChoice(nameComponents.prefixes.friendly);
        }
        
        // Choose suffix based on primary topic
        const primaryTopic = analysis.topics[0];
        if (primaryTopic && nameComponents.suffixes[primaryTopic]) {
            suffix = this.randomChoice(nameComponents.suffixes[primaryTopic]);
        }
        
        return `${prefix}${suffix}`;
    }

    // Map Analysis to Personality Traits
    mapTraits(analysis) {
        const traits = [];
        
        // Formality trait
        if (analysis.formality > 0.7) {
            traits.push('Professional');
        } else if (analysis.formality < 0.3) {
            traits.push('Casual');
        } else {
            traits.push('Balanced');
        }
        
        // Energy trait
        if (analysis.energy > 0.7) {
            traits.push('Energetic');
        } else if (analysis.energy < 0.3) {
            traits.push('Calm');
        } else {
            traits.push('Moderate');
        }
        
        // Sentiment trait
        if (analysis.sentiment.strength > 0.5) {
            traits.push(analysis.sentiment.polarity === 'positive' ? 'Optimistic' : 'Thoughtful');
        }
        
        // Communication style traits
        if (analysis.questionRatio > 0.3) {
            traits.push('Curious');
        }
        
        if (analysis.exclamationRatio > 0.3) {
            traits.push('Expressive');
        }
        
        // Topic-based traits
        if (analysis.topics.includes('creativity')) traits.push('Creative');
        if (analysis.topics.includes('technology')) traits.push('Tech-Savvy');
        if (analysis.topics.includes('business')) traits.push('Strategic');
        
        // Vocabulary richness trait
        if (analysis.vocabulary.richness > 0.7) {
            traits.push('Articulate');
        }
        
        return traits.slice(0, 5); // Limit to 5 traits
    }

    // Generate Signature Phrases
    generateSignaturePhrases(analysis, originalText) {
        const phrases = [];
        
        // Energy-based phrases
        if (analysis.energy > 0.7) {
            phrases.push(this.randomChoice([
                "Let's make it happen!", "That's absolutely amazing!", "I'm so excited about this!",
                "This is going to be incredible!", "Let's dive right in!"
            ]));
        } else if (analysis.energy < 0.3) {
            phrases.push(this.randomChoice([
                "Let's think about this carefully.", "That's quite interesting.", "I see what you mean.",
                "That makes a lot of sense.", "Let's consider the options."
            ]));
        }
        
        // Formality-based phrases
        if (analysis.formality > 0.7) {
            phrases.push(this.randomChoice([
                "I believe we should consider...", "In my professional opinion...",
                "Based on my experience...", "Let's approach this systematically.",
                "The optimal solution would be..."
            ]));
        } else if (analysis.formality < 0.3) {
            phrases.push(this.randomChoice([
                "Yeah, totally!", "That's pretty cool!", "I'm really into that!",
                "Sounds awesome to me!", "That's exactly what I mean!"
            ]));
        }
        
        // Sentiment-based phrases
        if (analysis.sentiment.polarity === 'positive') {
            phrases.push(this.randomChoice([
                "I love that idea!", "That sounds fantastic!", "This is going great!",
                "Perfect! That's exactly right!", "I'm really enjoying this!"
            ]));
        }
        
        // Topic-specific phrases
        if (analysis.topics.includes('creativity')) {
            phrases.push(this.randomChoice([
                "Let's think outside the box!", "That's so creative!", "I'm inspired by that!",
                "What if we tried something different?", "Creativity is everything!"
            ]));
        }
        
        if (analysis.topics.includes('technology')) {
            phrases.push(this.randomChoice([
                "That's technically fascinating!", "Let's optimize this!", "The future is here!",
                "Innovation at its finest!", "Technology makes everything possible!"
            ]));
        }
        
        // Extract potential phrases from original text
        const sentences = this.splitSentences(originalText);
        const shortSentences = sentences.filter(s => s.trim().split(' ').length < 8 && s.length > 10);
        if (shortSentences.length > 0) {
            phrases.push(this.randomChoice(shortSentences).trim());
        }
        
        return phrases.slice(0, 4); // Limit to 4 phrases
    }

    // Determine Emoji Style
    determineEmojiStyle(analysis) {
        let emojiSet = [];
        
        // Energy-based emojis
        if (analysis.energy > 0.7) {
            emojiSet.push(...['🚀', '⚡', '✨', '🎉', '💫', '🔥']);
        } else if (analysis.energy < 0.3) {
            emojiSet.push(...['🌙', '🍃', '💙', '🧘', '☁️', '🌊']);
        } else {
            emojiSet.push(...['😊', '👍', '🌟', '💭', '🎯', '⭐']);
        }
        
        // Topic-based emojis
        if (analysis.topics.includes('creativity')) {
            emojiSet.push(...['🎨', '✏️', '🎭', '🎪', '🌈', '💡']);
        }
        
        if (analysis.topics.includes('technology')) {
            emojiSet.push(...['💻', '🤖', '📱', '⚙️', '🔧', '🖥️']);
        }
        
        if (analysis.topics.includes('lifestyle')) {
            emojiSet.push(...['🌺', '☕', '🏃', '🍕', '🎵', '📚']);
        }
        
        // Sentiment-based emojis
        if (analysis.sentiment.polarity === 'positive') {
            emojiSet.push(...['😄', '❤️', '🎈', '🌻', '🦋', '🍀']);
        }
        
        // Use original emojis if available
        if (analysis.emojiUsage.favorites.length > 0) {
            emojiSet.push(...analysis.emojiUsage.favorites);
        }
        
        // Remove duplicates and return selection
        const uniqueEmojis = [...new Set(emojiSet)];
        return uniqueEmojis.slice(0, 6).join(' ');
    }

    // Select Avatar
    selectAvatar(analysis) {
        const avatars = {
            creative: ['🎨', '🎭', '🌈', '✨', '🎪', '🦋'],
            technology: ['🤖', '💻', '⚡', '🔮', '🛸', '🔧'],
            professional: ['👔', '📊', '🎯', '📈', '💼', '⚖️'],
            friendly: ['😊', '🌟', '🌞', '🎈', '🌸', '🦄'],
            energetic: ['🚀', '⚡', '🔥', '💫', '🌟', '⭐'],
            calm: ['🌙', '🧘', '🍃', '💙', '🌊', '☁️']
        };
        
        let category = 'friendly'; // default
        
        if (analysis.topics.includes('creativity')) category = 'creative';
        else if (analysis.topics.includes('technology')) category = 'technology';
        else if (analysis.formality > 0.7) category = 'professional';
        else if (analysis.energy > 0.7) category = 'energetic';
        else if (analysis.energy < 0.3) category = 'calm';
        
        return this.randomChoice(avatars[category]);
    }

    // Generate Tagline
    generateTagline(analysis) {
        const taglines = {
            creative_high_energy: "Turning imagination into reality with boundless creativity!",
            creative_low_energy: "Crafting thoughtful art with serene inspiration.",
            tech_high_energy: "Coding the future with unstoppable innovation!",
            tech_low_energy: "Building tomorrow's solutions with methodical precision.",
            professional_high_energy: "Leading dynamic teams to extraordinary results!",
            professional_low_energy: "Delivering excellence through strategic thinking.",
            friendly_high_energy: "Spreading joy and positive energy everywhere!",
            friendly_low_energy: "Creating meaningful connections with gentle wisdom.",
            default: "Bringing unique perspective to every conversation."
        };
        
        const primaryTopic = analysis.topics[0] || 'default';
        const energyLevel = analysis.energy > 0.6 ? 'high_energy' : 'low_energy';
        const key = `${primaryTopic}_${energyLevel}`;
        
        return taglines[key] || taglines.default;
    }

    // Display Generated Persona
    displayPersona(persona) {
        const personaDisplay = document.getElementById('personaDisplay');
        const personaCard = document.getElementById('personaCard');
        
        // Update persona header
        document.getElementById('personaAvatar').textContent = persona.avatar;
        document.getElementById('personaName').textContent = persona.name;
        document.getElementById('personaTagline').textContent = persona.tagline;
        
        // Update traits
        const traitsList = document.getElementById('traitsList');
        traitsList.innerHTML = persona.traits
            .map(trait => `<span class="trait-tag">${trait}</span>`)
            .join('');
        
        // Update signature phrases
        const phrasesList = document.getElementById('phrasesList');
        phrasesList.innerHTML = persona.signaturePhrases
            .map(phrase => `<span class="phrase-tag">"${phrase}"</span>`)
            .join('');
        
        // Update favorite words
        const wordsList = document.getElementById('wordsList');
        wordsList.innerHTML = persona.favoriteWords
            .map(word => `<span class="word-tag">${word}</span>`)
            .join('');
        
        // Update emoji style
        document.getElementById('emojiStyle').textContent = persona.emojiStyle;
        
        // Show the persona display
        personaDisplay.style.display = 'block';
        personaCard.scrollIntoView({ behavior: 'smooth' });
        
        // Update UI state
        this.toggleGenerateButton();
    }

    // Chat Simulation Engine
    startChat() {
        if (!this.currentPersona) return;
        
        const chatPersonaName = document.getElementById('chatPersonaName');
        const chatInputContainer = document.getElementById('chatInputContainer');
        const chatMessages = document.getElementById('chatMessages');
        const statsSection = document.getElementById('statsSection');
        
        chatPersonaName.textContent = `Chatting with ${this.currentPersona.name}`;
        chatInputContainer.style.display = 'block';
        statsSection.style.display = 'block';
        
        // Clear previous messages
        chatMessages.innerHTML = '';
        this.chatHistory = [];
        
        // Add welcome message from persona
        this.addBotMessage(this.generateWelcomeMessage());
        
        // Update stats
        this.updateChatStats();
        
        // Focus on chat input
        document.getElementById('chatInput').focus();
    }

    // Generate Welcome Message
    generateWelcomeMessage() {
        const persona = this.currentPersona;
        const welcomeTemplates = [
            `Hey there! I'm ${persona.name}. ${persona.signaturePhrases[0] || 'Great to meet you!'}`,
            `Hello! ${persona.name} here. Ready for an interesting conversation?`,
            `Hi! I'm ${persona.name}, and I'm excited to chat with you today!`,
            `Welcome! I'm ${persona.name}. ${persona.tagline.split('.')[0]}.`
        ];
        
        let message = this.randomChoice(welcomeTemplates);
        
        // Add emoji if persona uses them
        if (persona.emojiStyle) {
            const firstEmoji = persona.emojiStyle.split(' ')[0];
            message += ` ${firstEmoji}`;
        }
        
        return message;
    }

    // Send User Message
    sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message || !this.currentPersona) return;
        
        // Add user message
        this.addUserMessage(message);
        
        // Clear input
        chatInput.value = '';
        this.toggleSendButton();
        
        // Generate and add bot response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addBotMessage(response);
            this.updateChatStats();
        }, 500 + Math.random() * 1000); // Simulate thinking time
    }

    // Add User Message to Chat
    addUserMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-user';
        messageElement.innerHTML = `
            <div class="message-bubble">${this.escapeHtml(message)}</div>
            <div class="message-timestamp">${this.formatTime(new Date())}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        this.chatHistory.push({ type: 'user', message, timestamp: Date.now() });
    }

    // Add Bot Message to Chat
    addBotMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-bot';
        messageElement.innerHTML = `
            <div class="message-bubble">${this.escapeHtml(message)}</div>
            <div class="message-timestamp">${this.formatTime(new Date())}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        this.chatHistory.push({ type: 'bot', message, timestamp: Date.now() });
    }

    // Generate Response using Template-based Approach
    generateResponse(userMessage) {
        const persona = this.currentPersona;
        const analysis = persona.analysisData;
        
        // Analyze user message
        const userTokens = this.tokenize(userMessage.toLowerCase());
        const isQuestion = userMessage.includes('?');
        const sentiment = this.analyzeSentiment(userTokens);
        
        // Response templates based on persona characteristics
        let response = '';
        
        if (isQuestion) {
            response = this.generateAnswerResponse(userMessage, userTokens, persona);
        } else {
            response = this.generateReactiveResponse(userMessage, userTokens, sentiment, persona);
        }
        
        // Apply persona's communication style
        response = this.applyPersonaStyle(response, persona);
        
        return response;
    }

    // Generate Answer Response
    generateAnswerResponse(userMessage, userTokens, persona) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
        const questionType = questionWords.find(word => userTokens.includes(word)) || 'general';
        
        const answerTemplates = {
            what: [
                "That's a great question! From my perspective,",
                "I think what's really important here is",
                "You know, I've always believed that",
                "That's something I've thought about, and"
            ],
            how: [
                "Here's how I see it:",
                "My approach would be to",
                "I've found that the best way is",
                "From my experience, you can"
            ],
            why: [
                "That's because",
                "The reason I think that is",
                "Well, in my opinion",
                "I believe it's because"
            ],
            general: [
                "That's an interesting question!",
                "Let me think about that...",
                "You know what?",
                "Here's what I think:"
            ]
        };
        
        const template = this.randomChoice(answerTemplates[questionType] || answerTemplates.general);
        const elaboration = this.generateElaboration(userTokens, persona);
        
        return `${template} ${elaboration}`;
    }

    // Generate Reactive Response
    generateReactiveResponse(userMessage, userTokens, sentiment, persona) {
        const reactionTemplates = {
            positive: [
                "I love that!",
                "That sounds amazing!",
                "Absolutely!",
                "That's fantastic!",
                "I'm so glad you mentioned that!"
            ],
            negative: [
                "I understand what you mean.",
                "That can be challenging.",
                "I hear you on that.",
                "That's tough to deal with.",
                "I get where you're coming from."
            ],
            neutral: [
                "Interesting!",
                "That's a good point.",
                "I see what you're saying.",
                "That makes sense.",
                "Tell me more about that."
            ]
        };
        
        const reactionType = sentiment.polarity === 'positive' ? 'positive' : 
                            sentiment.polarity === 'negative' ? 'negative' : 'neutral';
        
        const reaction = this.randomChoice(reactionTemplates[reactionType]);
        const followUp = this.generateFollowUp(userTokens, persona);
        
        return `${reaction} ${followUp}`;
    }

    // Generate Elaboration
    generateElaboration(userTokens, persona) {
        const topics = persona.communicationStyle.topics || [];
        const favoriteWords = persona.favoriteWords || [];
        
        // Find relevant topic
        const relevantTopic = topics.find(topic => 
            userTokens.some(token => token.includes(topic))
        );
        
        const elaborations = {
            technology: [
                "Technology is constantly evolving and shaping our future.",
                "The digital world offers incredible possibilities.",
                "Innovation drives progress in amazing ways.",
                "Tech solutions can solve so many problems."
            ],
            creativity: [
                "Creativity is the spark that ignites amazing ideas.",
                "Art and imagination make life so much richer.",
                "There's beauty in every creative expression.",
                "Thinking outside the box opens new possibilities."
            ],
            business: [
                "Strategic thinking is key to success.",
                "Leadership requires both vision and execution.",
                "Effective planning makes all the difference.",
                "Professional growth comes from continuous learning."
            ],
            lifestyle: [
                "Life is all about finding balance and joy.",
                "Personal experiences shape who we become.",
                "Every day brings new opportunities.",
                "It's important to enjoy the journey."
            ]
        };
        
        if (relevantTopic && elaborations[relevantTopic]) {
            return this.randomChoice(elaborations[relevantTopic]);
        }
        
        // Use favorite words in response
        if (favoriteWords.length > 0) {
            const word = this.randomChoice(favoriteWords);
            return `I think ${word} is really important in this context.`;
        }
        
        return "It's all about perspective and finding what works best!";
    }

    // Generate Follow-up
    generateFollowUp(userTokens, persona) {
        const followUps = [
            "What's your take on that?",
            "Have you experienced something similar?",
            "I'd love to hear more about your thoughts.",
            "What do you think about it?",
            "How do you see it from your perspective?",
            "What's been your experience with that?"
        ];
        
        // If persona is curious, ask more questions
        if (persona.traits.includes('Curious')) {
            return this.randomChoice(followUps);
        }
        
        // If persona is expressive, add enthusiasm
        if (persona.traits.includes('Expressive') || persona.traits.includes('Energetic')) {
            return "I find that really exciting to think about!";
        }
        
        return this.randomChoice([
            "That's something worth considering.",
            "It's always interesting to explore different ideas.",
            "There's so much to learn from different perspectives."
        ]);
    }

    // Apply Persona Communication Style
    applyPersonaStyle(response, persona) {
        let styledResponse = response;
        
        // Apply formality
        if (persona.communicationStyle.formality > 0.7) {
            styledResponse = this.makeFormal(styledResponse);
        } else if (persona.communicationStyle.formality < 0.3) {
            styledResponse = this.makeInformal(styledResponse);
        }
        
        // Apply energy level
        if (persona.communicationStyle.energy > 0.7) {
            if (!styledResponse.includes('!')) {
                styledResponse += '!';
            }
        }
        
        // Add signature phrase occasionally
        if (Math.random() < 0.3 && persona.signaturePhrases.length > 0) {
            const phrase = this.randomChoice(persona.signaturePhrases);
            styledResponse += ` ${phrase}`;
        }
        
        // Add emoji occasionally
        if (Math.random() < 0.4 && persona.emojiStyle) {
            const emojis = persona.emojiStyle.split(' ');
            const emoji = this.randomChoice(emojis);
            styledResponse += ` ${emoji}`;
        }
        
        return styledResponse;
    }

    // Make Response More Formal
    makeFormal(response) {
        return response
            .replace(/\bthat's\b/gi, 'that is')
            .replace(/\bcan't\b/gi, 'cannot')
            .replace(/\bwon't\b/gi, 'will not')
            .replace(/\bI'm\b/gi, 'I am')
            .replace(/\byou're\b/gi, 'you are');
    }

    // Make Response More Informal
    makeInformal(response) {
        return response
            .replace(/\bthat is\b/gi, "that's")
            .replace(/\bcannot\b/gi, "can't")
            .replace(/\bwill not\b/gi, "won't")
            .replace(/\bI am\b/gi, "I'm")
            .replace(/\byou are\b/gi, "you're");
    }

    // Data Persistence - Save Persona
    saveCurrentPersona() {
        if (!this.currentPersona) return;
        
        // Check if persona already exists
        const existingIndex = this.savedPersonas.findIndex(p => p.id === this.currentPersona.id);
        
        if (existingIndex >= 0) {
            // Update existing persona
            this.savedPersonas[existingIndex] = { ...this.currentPersona };
            this.showToast('Persona updated!', 'success');
        } else {
            // Add new persona
            this.savedPersonas.push({ ...this.currentPersona });
            this.showToast('Persona saved successfully!', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('aiPersonaWriter_personas', JSON.stringify(this.savedPersonas));
        
        // Update UI
        this.displaySavedPersonas();
    }

    // Load Saved Personas
    loadSavedPersonas() {
        try {
            const saved = localStorage.getItem('aiPersonaWriter_personas');
            this.savedPersonas = saved ? JSON.parse(saved) : [];
            this.displaySavedPersonas();
        } catch (error) {
            console.error('Error loading saved personas:', error);
            this.savedPersonas = [];
        }
    }

    // Display Saved Personas
    displaySavedPersonas() {
        const container = document.getElementById('savedPersonas');
        const clearAllBtn = document.getElementById('clearAllBtn');
        
        if (this.savedPersonas.length === 0) {
            container.innerHTML = '<div class="no-personas"><p>No saved personas yet. Generate your first one!</p></div>';
            clearAllBtn.style.display = 'none';
            return;
        }
        
        clearAllBtn.style.display = 'block';
        
        container.innerHTML = this.savedPersonas.map(persona => `
            <div class="saved-persona-item" data-persona-id="${persona.id}">
                <div class="saved-persona-header">
                    <div class="saved-persona-name">${persona.avatar} ${persona.name}</div>
                    <div class="saved-persona-actions">
                        <button class="mini-btn load-persona" data-persona-id="${persona.id}">Load</button>
                        <button class="mini-btn chat-persona" data-persona-id="${persona.id}">Chat</button>
                        <button class="mini-btn delete-persona" data-persona-id="${persona.id}">Delete</button>
                    </div>
                </div>
                <div class="persona-preview">
                    <small>${persona.tagline}</small><br>
                    <small style="color: var(--text-muted);">Created: ${new Date(persona.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
        
        // Bind events for saved personas
        this.bindSavedPersonaEvents();
    }

    // Bind Events for Saved Personas
    bindSavedPersonaEvents() {
        document.querySelectorAll('.load-persona').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const personaId = e.target.dataset.personaId;
                this.loadPersona(personaId);
            });
        });
        
        document.querySelectorAll('.chat-persona').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const personaId = e.target.dataset.personaId;
                this.loadPersona(personaId);
                setTimeout(() => this.startChat(), 100);
            });
        });
        
        document.querySelectorAll('.delete-persona').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const personaId = e.target.dataset.personaId;
                this.deletePersona(personaId);
            });
        });
    }

    // Load Persona by ID
    loadPersona(personaId) {
        const persona = this.savedPersonas.find(p => p.id === personaId);
        if (persona) {
            this.currentPersona = persona;
            this.displayPersona(persona);
            this.showToast(`Loaded ${persona.name}!`, 'success');
        }
    }

    // Delete Persona
    deletePersona(personaId) {
        if (confirm('Are you sure you want to delete this persona?')) {
            this.savedPersonas = this.savedPersonas.filter(p => p.id !== personaId);
            localStorage.setItem('aiPersonaWriter_personas', JSON.stringify(this.savedPersonas));
            this.displaySavedPersonas();
            
            // If deleted persona is current, clear it
            if (this.currentPersona && this.currentPersona.id === personaId) {
                this.currentPersona = null;
                document.getElementById('personaDisplay').style.display = 'none';
            }
            
            this.showToast('Persona deleted.', 'warning');
        }
    }

    // Clear All Personas
    clearAllPersonas() {
        if (confirm('Are you sure you want to delete all saved personas? This cannot be undone.')) {
            this.savedPersonas = [];
            localStorage.removeItem('aiPersonaWriter_personas');
            this.displaySavedPersonas();
            this.currentPersona = null;
            document.getElementById('personaDisplay').style.display = 'none';
            this.showToast('All personas deleted.', 'warning');
        }
    }

    // Chat Management
    clearChat() {
        if (confirm('Clear the current chat conversation?')) {
            document.getElementById('chatMessages').innerHTML = '';
            this.chatHistory = [];
            
            if (this.currentPersona) {
                this.addBotMessage(this.generateWelcomeMessage());
            }
            
            this.updateChatStats();
            this.showToast('Chat cleared.', 'warning');
        }
    }

    // Export Chat
    exportChat() {
        if (this.chatHistory.length === 0) {
            this.showToast('No chat to export.', 'warning');
            return;
        }
        
        const chatData = {
            persona: this.currentPersona ? {
                name: this.currentPersona.name,
                avatar: this.currentPersona.avatar
            } : null,
            messages: this.chatHistory,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_${this.currentPersona?.name || 'conversation'}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Chat exported!', 'success');
    }

    // Update Chat Statistics
    updateChatStats() {
        const statsGrid = document.getElementById('statsGrid');
        if (!this.currentPersona || !statsGrid) return;
        
        const userMessages = this.chatHistory.filter(m => m.type === 'user');
        const botMessages = this.chatHistory.filter(m => m.type === 'bot');
        
        const stats = {
            'Messages': this.chatHistory.length,
            'Your Messages': userMessages.length,
            'AI Responses': botMessages.length,
            'Avg Response Time': '0.8s',
            'Conversation Score': Math.min(100, this.chatHistory.length * 5),
            'Engagement Level': this.chatHistory.length > 10 ? 'High' : this.chatHistory.length > 5 ? 'Medium' : 'Low'
        };
        
        statsGrid.innerHTML = Object.entries(stats)
            .map(([label, value]) => `
                <div class="stat-card">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            `).join('');
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Loading Overlay Management
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        const loadingMessages = [
            'Processing natural language patterns',
            'Analyzing communication style',
            'Mapping personality traits',
            'Generating unique persona',
            'Fine-tuning characteristics',
            'Almost ready...'
        ];
        
        let messageIndex = 0;
        overlay.style.display = 'flex';
        
        const interval = setInterval(() => {
            if (messageIndex < loadingMessages.length) {
                loadingText.textContent = loadingMessages[messageIndex];
                messageIndex++;
            } else {
                clearInterval(interval);
            }
        }, 300);
        
        // Store interval ID to clear it if needed
        this.loadingInterval = interval;
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'none';
        
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
    }

    // Toast Notification System
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    window.personaWriter = new PersonaWriter();
    
    // Add some fun console messages
    console.log('🤖 AI Persona Writer loaded successfully!');
    console.log('✨ No APIs, no servers - pure client-side magic!');
    console.log('🎭 Ready to create amazing AI personas from your writing style!');
});