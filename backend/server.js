const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'symptom_history.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS symptom_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symptoms TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Medical disclaimer constant
const MEDICAL_DISCLAIMER = `
IMPORTANT MEDICAL DISCLAIMER: This analysis is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read here. If you think you may have a medical emergency, call your doctor or emergency services immediately.
`;

// LLM Integration Functions
class SymptomAnalyzer {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
    }

    createMedicalPrompt(symptoms, age = null, gender = null) {
        let prompt = `
        You are a medical AI assistant providing educational information only. 
        Analyze the following symptoms and provide possible conditions with educational disclaimers.
        
        CRITICAL INSTRUCTIONS:
        1. This is for EDUCATIONAL PURPOSES ONLY
        2. Always recommend consulting healthcare professionals
        3. Provide probability estimates as ranges (e.g., "High (70-80%)")
        4. Include clear limitations of AI medical advice
        5. For serious symptoms, recommend immediate medical attention
        
        Patient Information:
        - Symptoms: ${symptoms}
        `;
        
        if (age) prompt += `- Age: ${age} years\n`;
        if (gender) prompt += `- Gender: ${gender}\n`;
        
        prompt += `
        
        Please provide a JSON response with this exact structure:
        {
            "conditions": [
                {
                    "name": "Condition Name",
                    "probability": "High/Medium/Low (percentage range)",
                    "description": "Clear description",
                    "next_steps": ["Step 1", "Step 2", "Step 3"],
                    "urgency": "low/medium/high"
                }
            ],
            "red_flags": ["Symptom 1", "Symptom 2"],
            "general_advice": "General recommendations",
            "when_to_seek_help": "Specific guidance on when to contact healthcare providers"
        }
        `;
        
        return prompt;
    }

    async analyzeWithOpenAI(prompt) {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const { OpenAI } = require('openai');
            const openai = new OpenAI({ apiKey: this.apiKey });

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant focused on education and safety. Always include appropriate medical disclaimers and respond with valid JSON only."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return this.getFallbackResponse();
        }
    }

    getMockResponse(symptoms) {
        const symptomLower = symptoms.toLowerCase();
        
        if (symptomLower.includes('headache') || symptomLower.includes('fever') || symptomLower.includes('fatigue')) {
            return {
                conditions: [
                    {
                        name: "Viral Upper Respiratory Infection",
                        probability: "High (70-85%)",
                        description: "Common viral infection affecting the upper respiratory tract, causing systemic symptoms like fever, headache, and fatigue.",
                        next_steps: [
                            "Rest and stay well-hydrated with plenty of fluids",
                            "Use over-the-counter pain relievers as directed on packaging",
                            "Monitor temperature and symptoms progression",
                            "Consult healthcare provider if symptoms worsen or persist beyond 7-10 days"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Seasonal Influenza",
                        probability: "Medium (40-60%)",
                        description: "Influenza virus infection causing systemic symptoms including fever, fatigue, headache, and body aches.",
                        next_steps: [
                            "Rest and increase fluid intake significantly",
                            "Consider antiviral medication if within 48 hours of symptom onset",
                            "Use symptom relief medications as appropriate",
                            "Seek medical attention if high fever persists or breathing difficulties develop"
                        ],
                        urgency: "medium"
                    },
                    {
                        name: "Stress-Related Physical Symptoms",
                        probability: "Low (20-30%)",
                        description: "Physical symptoms that can result from psychological stress, anxiety, or lifestyle factors.",
                        next_steps: [
                            "Evaluate recent stress levels and significant life changes",
                            "Practice stress reduction techniques like meditation or deep breathing",
                            "Ensure adequate sleep (7-9 hours) and proper nutrition",
                            "Consider counseling or stress management resources if symptoms persist"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "High fever above 103°F (39.4°C)",
                    "Difficulty breathing or shortness of breath",
                    "Severe headache with neck stiffness or confusion",
                    "Persistent vomiting preventing fluid intake",
                    "Signs of severe dehydration"
                ],
                general_advice: "Monitor symptoms closely and maintain good hygiene practices to prevent spread if infectious. Keep a symptom diary to track progression.",
                when_to_seek_help: "Contact a healthcare provider if symptoms worsen significantly, persist beyond 10 days, or if you develop any of the red flag symptoms listed above."
            };
        }
        
        // Respiratory symptoms
        if (symptomLower.includes('cough') || symptomLower.includes('shortness') || symptomLower.includes('chest')) {
            return {
                conditions: [
                    {
                        name: "Acute Bronchitis",
                        probability: "High (60-75%)",
                        description: "Inflammation of the bronchial tubes, often following a cold or respiratory infection.",
                        next_steps: [
                            "Stay hydrated and use a humidifier",
                            "Rest and avoid irritants like smoke",
                            "Use over-the-counter cough suppressants if needed",
                            "See a doctor if symptoms persist beyond 3 weeks"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Asthma Exacerbation",
                        probability: "Medium (30-45%)",
                        description: "Temporary worsening of asthma symptoms affecting breathing.",
                        next_steps: [
                            "Use rescue inhaler as prescribed",
                            "Identify and avoid triggers",
                            "Monitor peak flow if available",
                            "Seek immediate care if breathing becomes severely difficult"
                        ],
                        urgency: "high"
                    }
                ],
                red_flags: [
                    "Severe difficulty breathing",
                    "Chest pain with breathing",
                    "Blue lips or fingernails",
                    "Cannot speak in full sentences due to breathlessness"
                ],
                general_advice: "Respiratory symptoms can indicate various conditions. Pay attention to breathing patterns and seek help for severe symptoms.",
                when_to_seek_help: "Seek immediate medical attention for severe breathing difficulties. Contact your healthcare provider for persistent cough or worsening symptoms."
            };
        }

        // Default response
        return {
            conditions: [
                {
                    name: "Requires Professional Medical Evaluation",
                    probability: "Assessment Needed",
                    description: "The symptoms described require professional medical evaluation for proper assessment and diagnosis.",
                    next_steps: [
                        "Schedule an appointment with your primary healthcare provider",
                        "Keep a detailed log of symptoms including timing, severity, and triggers",
                        "Note any alleviating or worsening factors",
                        "Prepare a list of current medications and relevant medical history"
                    ],
                    urgency: "medium"
                }
            ],
            red_flags: [
                "Severe or rapidly worsening symptoms",
                "Signs of emergency medical conditions",
                "Symptoms significantly affecting daily function"
            ],
            general_advice: "When in doubt about symptoms, it's always best to consult with healthcare professionals who can provide proper evaluation.",
            when_to_seek_help: "Contact your healthcare provider to discuss these symptoms and determine the appropriate next steps for evaluation and care."
        };
    }

    getFallbackResponse() {
        return {
            conditions: [
                {
                    name: "Analysis Service Temporarily Unavailable",
                    probability: "N/A",
                    description: "The AI analysis service is currently unavailable. Please consult with a healthcare provider directly.",
                    next_steps: [
                        "Contact your primary healthcare provider",
                        "Visit an urgent care center if symptoms are concerning",
                        "Call emergency services if experiencing severe symptoms",
                        "Try the service again later"
                    ],
                    urgency: "medium"
                }
            ],
            red_flags: ["Any severe or rapidly worsening symptoms"],
            general_advice: "When AI services are unavailable, always err on the side of caution and seek professional medical advice.",
            when_to_seek_help: "Contact healthcare providers directly for symptom evaluation when automated services are unavailable."
        };
    }

    async analyzeSymptoms(symptoms, age = null, gender = null) {
        const prompt = this.createMedicalPrompt(symptoms, age, gender);
        
        if (this.apiKey) {
            return await this.analyzeWithOpenAI(prompt);
        } else {
            // Use mock response when no API key is available
            return this.getMockResponse(symptoms);
        }
    }
}

// Initialize analyzer
const analyzer = new SymptomAnalyzer();

// Database helper functions
function saveQueryToDatabase(symptoms, age, gender, response) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO symptom_queries (symptoms, age, gender, response)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run([symptoms, age, gender, JSON.stringify(response)], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        
        stmt.finalize();
    });
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Healthcare Symptom Checker API',
        status: 'active',
        version: '1.0.0',
        endpoints: {
            'POST /api/analyze-symptoms': 'Analyze symptoms and get recommendations',
            'GET /api/health': 'Health check endpoint',
            'GET /api/history': 'Get query history'
        }
    });
});

app.post('/api/analyze-symptoms', async (req, res) => {
    try {
        const { symptoms, age, gender } = req.body;
        
        // Validation
        if (!symptoms || symptoms.trim().length === 0) {
            return res.status(400).json({
                error: 'Symptoms are required',
                message: 'Please provide a description of your symptoms'
            });
        }

        if (symptoms.trim().length < 3) {
            return res.status(400).json({
                error: 'Symptoms too short',
                message: 'Please provide a more detailed description of your symptoms'
            });
        }
        
        // Analyze symptoms
        const analysisResult = await analyzer.analyzeSymptoms(symptoms, age, gender);
        
        // Prepare response
        const response = {
            conditions: analysisResult.conditions,
            red_flags: analysisResult.red_flags || [],
            general_advice: analysisResult.general_advice || '',
            when_to_seek_help: analysisResult.when_to_seek_help || '',
            disclaimer: MEDICAL_DISCLAIMER,
            timestamp: new Date().toISOString(),
            query_info: {
                symptoms: symptoms.trim(),
                age: age || null,
                gender: gender || null
            }
        };
        
        // Save to database
        try {
            await saveQueryToDatabase(symptoms, age, gender, response);
        } catch (dbError) {
            console.error('Database save error:', dbError);
            // Continue with response even if database save fails
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: 'An error occurred while analyzing symptoms. Please try again or consult a healthcare provider.',
            disclaimer: MEDICAL_DISCLAIMER
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Healthcare Symptom Checker API',
        database: 'connected'
    });
});

app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    db.all(
        `SELECT symptoms, age, gender, timestamp 
         FROM symptom_queries 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Could not retrieve query history'
                });
            }
            
            res.json({
                recent_queries: rows.map(row => ({
                    symptoms: row.symptoms,
                    age: row.age,
                    gender: row.gender,
                    timestamp: row.timestamp
                })),
                total_returned: rows.length,
                disclaimer: 'Query history is for demonstration purposes only'
            });
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        disclaimer: MEDICAL_DISCLAIMER
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist',
        available_endpoints: [
            'POST /api/analyze-symptoms',
            'GET /api/health',
            'GET /api/history'
        ]
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 Healthcare Symptom Checker API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 API documentation: http://localhost:${PORT}/`);
});

module.exports = app;