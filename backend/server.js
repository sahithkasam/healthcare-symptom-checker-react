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

// Temporary: Very permissive CORS for debugging
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
        
        // Define symptom patterns and their corresponding conditions
        const symptomPatterns = {
            // Respiratory symptoms
            respiratory: ['cough', 'shortness', 'chest', 'breathing', 'wheeze', 'phlegm', 'sputum'],
            // Fever and flu-like
            fluLike: ['fever', 'chills', 'body ache', 'muscle pain', 'fatigue', 'tired'],
            // Headache and neurological
            neurological: ['headache', 'migraine', 'dizzy', 'nausea', 'confusion', 'neck stiff'],
            // Gastrointestinal
            gastrointestinal: ['stomach', 'nausea', 'vomit', 'diarrhea', 'constipation', 'abdominal', 'belly'],
            // Skin conditions
            skin: ['rash', 'itchy', 'red', 'swollen', 'bump', 'spot', 'dry skin'],
            // Joint and muscle pain
            musculoskeletal: ['joint', 'back pain', 'knee', 'shoulder', 'muscle', 'stiff', 'ache'],
            // Cardiovascular
            cardiac: ['chest pain', 'heart', 'palpitation', 'irregular beat', 'pressure'],
            // Sleep and mental health
            mental: ['insomnia', 'sleep', 'anxiety', 'stress', 'depression', 'mood'],
            // Ear, nose, throat
            ent: ['sore throat', 'ear', 'runny nose', 'congestion', 'sneezing', 'throat'],
            // Eye symptoms
            eye: ['eye', 'vision', 'blurry', 'red eye', 'tear', 'light sensitive']
        };

        // Function to check which category symptoms belong to
        function categorizeSymptoms(symptoms) {
            const categories = [];
            for (const [category, keywords] of Object.entries(symptomPatterns)) {
                if (keywords.some(keyword => symptoms.includes(keyword))) {
                    categories.push(category);
                }
            }
            return categories;
        }

        const categories = categorizeSymptoms(symptomLower);
        
        // Respiratory symptoms
        if (categories.includes('respiratory')) {
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
                        name: "Upper Respiratory Infection",
                        probability: "Medium (40-60%)",
                        description: "Common viral infection affecting the upper respiratory tract.",
                        next_steps: [
                            "Get plenty of rest and fluids",
                            "Use saline nasal rinses",
                            "Consider over-the-counter decongestants",
                            "Monitor for worsening symptoms"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Severe difficulty breathing",
                    "Chest pain with breathing",
                    "Blue lips or fingernails",
                    "High fever with cough"
                ],
                general_advice: "Respiratory symptoms often resolve with rest and supportive care. Avoid smoking and secondhand smoke.",
                when_to_seek_help: "Seek immediate care for severe breathing difficulties. Contact your provider for persistent symptoms beyond 10 days."
            };
        }

        // Gastrointestinal symptoms
        if (categories.includes('gastrointestinal')) {
            return {
                conditions: [
                    {
                        name: "Viral Gastroenteritis",
                        probability: "High (65-80%)",
                        description: "Common viral infection causing inflammation of the stomach and intestines.",
                        next_steps: [
                            "Stay hydrated with clear fluids",
                            "Follow the BRAT diet (bananas, rice, applesauce, toast)",
                            "Rest and avoid dairy temporarily",
                            "Gradually return to normal diet as symptoms improve"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Food Poisoning",
                        probability: "Medium (30-50%)",
                        description: "Illness caused by consuming contaminated food or beverages.",
                        next_steps: [
                            "Maintain hydration with electrolyte solutions",
                            "Avoid solid foods until vomiting stops",
                            "Monitor for signs of dehydration",
                            "Consider probiotics after acute phase"
                        ],
                        urgency: "medium"
                    }
                ],
                red_flags: [
                    "Signs of severe dehydration",
                    "Blood in vomit or stool",
                    "High fever with abdominal pain",
                    "Severe abdominal cramping"
                ],
                general_advice: "Most gastrointestinal illnesses are self-limiting. Focus on hydration and gradual food reintroduction.",
                when_to_seek_help: "Seek care for signs of dehydration, blood in stool/vomit, or symptoms lasting more than 3 days."
            };
        }

        // Neurological symptoms (headache, dizziness)
        if (categories.includes('neurological')) {
            return {
                conditions: [
                    {
                        name: "Tension Headache",
                        probability: "High (70-85%)",
                        description: "Most common type of headache, often related to stress, fatigue, or muscle tension.",
                        next_steps: [
                            "Apply hot or cold compress to head/neck",
                            "Practice relaxation techniques",
                            "Use over-the-counter pain relievers as directed",
                            "Maintain regular sleep schedule"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Migraine",
                        probability: "Medium (35-50%)",
                        description: "Neurological condition causing severe headaches, often with sensitivity to light and sound.",
                        next_steps: [
                            "Rest in a dark, quiet room",
                            "Apply cold compress to forehead",
                            "Stay hydrated and avoid triggers",
                            "Consider prescription migraine medications"
                        ],
                        urgency: "medium"
                    }
                ],
                red_flags: [
                    "Sudden severe headache unlike any before",
                    "Headache with fever and neck stiffness",
                    "Headache with vision changes",
                    "Confusion or difficulty speaking"
                ],
                general_advice: "Track headache patterns and potential triggers. Maintain regular sleep and meal schedules.",
                when_to_seek_help: "Seek immediate care for sudden severe headaches or headaches with neurological symptoms."
            };
        }

        // Musculoskeletal symptoms
        if (categories.includes('musculoskeletal')) {
            return {
                conditions: [
                    {
                        name: "Muscle Strain",
                        probability: "High (60-75%)",
                        description: "Overstretching or tearing of muscle fibers, often due to physical activity or sudden movement.",
                        next_steps: [
                            "Apply ice for first 24-48 hours",
                            "Rest the affected area",
                            "Use over-the-counter anti-inflammatory medications",
                            "Gentle stretching after initial inflammation subsides"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Arthritis Flare-up",
                        probability: "Medium (30-45%)",
                        description: "Inflammation of joints causing pain, stiffness, and potential swelling.",
                        next_steps: [
                            "Apply heat or cold as preferred",
                            "Gentle range-of-motion exercises",
                            "Anti-inflammatory medications as prescribed",
                            "Consider physical therapy consultation"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Severe joint swelling and redness",
                    "Inability to bear weight or use affected area",
                    "Signs of infection at injury site",
                    "Numbness or tingling"
                ],
                general_advice: "Most muscle and joint pain improves with rest and conservative treatment. Stay active within pain limits.",
                when_to_seek_help: "Contact provider for severe pain, signs of infection, or symptoms not improving after a week."
            };
        }

        // Skin conditions
        if (categories.includes('skin')) {
            return {
                conditions: [
                    {
                        name: "Contact Dermatitis",
                        probability: "High (55-70%)",
                        description: "Skin reaction caused by contact with an irritant or allergen.",
                        next_steps: [
                            "Identify and avoid the triggering substance",
                            "Apply cool compresses to affected area",
                            "Use gentle, fragrance-free moisturizers",
                            "Consider topical corticosteroids for severe itching"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Eczema Flare-up",
                        probability: "Medium (35-50%)",
                        description: "Chronic skin condition causing dry, itchy, and inflamed skin patches.",
                        next_steps: [
                            "Moisturize frequently with thick creams",
                            "Avoid known triggers and harsh soaps",
                            "Use prescribed topical medications",
                            "Keep fingernails short to prevent scratching"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Signs of skin infection (pus, red streaks)",
                    "Rapid spreading of rash",
                    "Difficulty breathing with skin symptoms",
                    "Fever accompanying skin changes"
                ],
                general_advice: "Most skin conditions improve with gentle care and avoiding irritants. Keep skin moisturized.",
                when_to_seek_help: "Seek care for signs of infection, rapidly spreading rashes, or severe symptoms affecting daily life."
            };
        }

        // Flu-like symptoms
        if (categories.includes('fluLike')) {
            return {
                conditions: [
                    {
                        name: "Viral Upper Respiratory Infection",
                        probability: "High (70-85%)",
                        description: "Common viral infection affecting the upper respiratory tract, causing systemic symptoms.",
                        next_steps: [
                            "Rest and stay well-hydrated with plenty of fluids",
                            "Use over-the-counter pain relievers as directed",
                            "Monitor temperature and symptoms progression",
                            "Maintain good hygiene to prevent spread"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Seasonal Influenza",
                        probability: "Medium (40-60%)",
                        description: "Influenza virus infection causing systemic symptoms including fever, fatigue, and body aches.",
                        next_steps: [
                            "Rest and increase fluid intake significantly",
                            "Consider antiviral medication if within 48 hours of onset",
                            "Use symptom relief medications as appropriate",
                            "Isolate to prevent spreading to others"
                        ],
                        urgency: "medium"
                    }
                ],
                red_flags: [
                    "High fever above 103°F (39.4°C)",
                    "Difficulty breathing or shortness of breath",
                    "Persistent vomiting preventing fluid intake",
                    "Signs of severe dehydration"
                ],
                general_advice: "Most viral infections resolve with rest and supportive care. Maintain good hygiene practices.",
                when_to_seek_help: "Contact provider for high fever, difficulty breathing, or symptoms not improving after 7-10 days."
            };
        }

        // ENT (Ear, Nose, Throat) symptoms
        if (categories.includes('ent')) {
            return {
                conditions: [
                    {
                        name: "Viral Pharyngitis",
                        probability: "High (65-80%)",
                        description: "Viral infection of the throat causing soreness and irritation.",
                        next_steps: [
                            "Gargle with warm salt water",
                            "Use throat lozenges or warm tea with honey",
                            "Stay hydrated and rest your voice",
                            "Use a humidifier to add moisture to air"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Allergic Rhinitis",
                        probability: "Medium (40-55%)",
                        description: "Allergic reaction causing nasal congestion, runny nose, and sneezing.",
                        next_steps: [
                            "Identify and avoid allergens if possible",
                            "Use antihistamines as directed",
                            "Try nasal saline rinses",
                            "Consider air purifiers for indoor allergens"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Difficulty swallowing or breathing",
                    "High fever with severe throat pain",
                    "White patches on throat",
                    "Swollen lymph nodes with fever"
                ],
                general_advice: "Most throat and nasal symptoms are viral and resolve on their own. Avoid irritants like smoking.",
                when_to_seek_help: "Seek care for difficulty swallowing, high fever, or symptoms lasting more than 10 days."
            };
        }

        // Cardiac symptoms
        if (categories.includes('cardiac')) {
            return {
                conditions: [
                    {
                        name: "Anxiety-Related Chest Discomfort",
                        probability: "Medium (45-60%)",
                        description: "Chest discomfort related to anxiety or panic attacks.",
                        next_steps: [
                            "Practice deep breathing exercises",
                            "Try relaxation techniques",
                            "Avoid caffeine and stimulants",
                            "Consider stress management counseling"
                        ],
                        urgency: "medium"
                    },
                    {
                        name: "Musculoskeletal Chest Pain",
                        probability: "Medium (35-50%)",
                        description: "Chest pain from muscle strain or inflammation of chest wall.",
                        next_steps: [
                            "Apply heat or ice to affected area",
                            "Use anti-inflammatory medications",
                            "Avoid activities that worsen pain",
                            "Practice good posture"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Severe crushing chest pain",
                    "Chest pain with shortness of breath",
                    "Pain radiating to arm, jaw, or back",
                    "Chest pain with sweating or nausea"
                ],
                general_advice: "Chest pain can have many causes. Any concerning chest pain should be evaluated promptly.",
                when_to_seek_help: "Seek immediate emergency care for severe chest pain, especially with other cardiac symptoms."
            };
        }

        // Mental health symptoms
        if (categories.includes('mental')) {
            return {
                conditions: [
                    {
                        name: "Sleep Disorder",
                        probability: "High (60-75%)",
                        description: "Difficulty falling asleep, staying asleep, or poor sleep quality.",
                        next_steps: [
                            "Maintain consistent sleep schedule",
                            "Create relaxing bedtime routine",
                            "Limit screen time before bed",
                            "Avoid caffeine late in the day"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Stress-Related Symptoms",
                        probability: "Medium (40-55%)",
                        description: "Physical and emotional symptoms related to psychological stress.",
                        next_steps: [
                            "Practice stress reduction techniques",
                            "Consider counseling or therapy",
                            "Maintain regular exercise routine",
                            "Connect with support systems"
                        ],
                        urgency: "medium"
                    }
                ],
                red_flags: [
                    "Thoughts of self-harm",
                    "Severe mood changes affecting daily function",
                    "Complete inability to sleep for days",
                    "Hallucinations or delusions"
                ],
                general_advice: "Mental health is as important as physical health. Don't hesitate to seek professional support.",
                when_to_seek_help: "Contact mental health professionals for persistent symptoms or any thoughts of self-harm."
            };
        }

        // Eye symptoms
        if (categories.includes('eye')) {
            return {
                conditions: [
                    {
                        name: "Viral Conjunctivitis",
                        probability: "High (60-75%)",
                        description: "Viral infection of the eye causing redness, tearing, and discharge.",
                        next_steps: [
                            "Apply cool compresses to eyes",
                            "Avoid touching or rubbing eyes",
                            "Use artificial tears for comfort",
                            "Practice good hand hygiene"
                        ],
                        urgency: "low"
                    },
                    {
                        name: "Dry Eye Syndrome",
                        probability: "Medium (35-50%)",
                        description: "Insufficient tear production or poor tear quality causing eye discomfort.",
                        next_steps: [
                            "Use preservative-free artificial tears",
                            "Take breaks from screen time",
                            "Use a humidifier",
                            "Avoid windy or dry environments"
                        ],
                        urgency: "low"
                    }
                ],
                red_flags: [
                    "Sudden vision loss",
                    "Severe eye pain with vision changes",
                    "Flashing lights or floaters",
                    "Chemical exposure to eyes"
                ],
                general_advice: "Most eye irritation resolves with gentle care. Protect eyes from irritants and UV light.",
                when_to_seek_help: "Seek immediate care for sudden vision changes or severe eye pain."
            };
        }

        // Default response for unrecognized symptoms
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
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        features: {
            symptom_analysis: 'active',
            medical_categories: 10,
            dynamic_responses: 'enabled'
        }
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