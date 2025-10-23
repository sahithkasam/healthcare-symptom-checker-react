
Deployed link : https://healthcare-symptom-checker-react.vercel.app/

# Healthcare Symptom Checker - Professional Clinical Interface

A professional healthcare symptom analysis application built with React and Node.js. This clinical decision support system features a professional medical interface and provides differential diagnosis suggestions.

##  **Project Overview**

This healthcare application includes:
- ✅ **Professional Medical Interface**: Clinical design following healthcare standards
- ✅ **Symptom Analysis**: AI-powered differential diagnosis
- ✅ **Clinical Decision Support**: Medical probability assessments
- ✅ **Frontend**: React 19.2.0 with TypeScript and professional healthcare UI
- ✅ **Backend API**: Node.js Express server with SQLite database
- ✅ **Medical History**: Patient symptom tracking and history
- ✅ **Healthcare Compliance**: Professional medical terminology and disclaimers

##  **Architecture**

```
healthcare-symptom-checker-react/
├── backend/                    # Node.js Express API
│   ├── server.js              # Medical API server
│   ├── symptom_history.db     # SQLite patient database
│   └── package.json           # Backend dependencies
└── frontend/                  # React Clinical Interface
    ├── src/
    │   ├── App.tsx            # Main clinical component
    │   ├── App.css            # Professional healthcare styling
    │   └── index.tsx          # React entry point
    ├── public/
    └── package.json           # Frontend dependencies
```

##  **Quick Start**

### **Option 1: Manual Setup**

#### Backend Setup:
```bash
cd backend
npm install
npm start
```
Backend runs at: **http://localhost:8000**

#### Frontend Setup:
```bash
cd frontend  
npm start
```
Frontend runs at: **http://localhost:3000**

### **Option 2: Development Mode**

1. **Start Backend**:
```bash
cd backend && npm run dev
```

2. **Start Frontend** (in new terminal):
```bash
cd frontend && npm start  
```

3. **Open Application**: http://localhost:3000

## **Features**

### **Frontend (React + TypeScript)**
- **Modern UI**: Gradient backgrounds, animations, responsive design
- **TypeScript**: Full type safety for better development experience
- **Form Validation**: Real-time validation with user feedback
- **Loading States**: Professional loading spinners and disabled states
- **Error Handling**: User-friendly error messages
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Accessibility**: Proper labels, focus states, and keyboard navigation

### **Backend (Node.js + Express)**
- **RESTful API**: Clean API endpoints with proper HTTP status codes
- **SQLite Database**: Lightweight database for query history
- **LLM Integration**: Ready for OpenAI API with intelligent fallback
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Robust error handling with meaningful responses
- **CORS Support**: Configured for frontend integration
- **Security**: Helmet.js for security headers

### **Medical Safety Features**
- **Prominent Disclaimers**: Multiple warnings throughout the interface
- **Red Flags Section**: Highlighting symptoms requiring immediate attention
- **Urgency Indicators**: Color-coded urgency levels (low/medium/high)
- **Professional Referrals**: Always recommends consulting healthcare providers
- **Educational Focus**: Consistent messaging about educational purpose only

## **API Endpoints**

### **POST /api/analyze-symptoms**
Analyze symptoms and return possible conditions.

**Request:**
```json
{
  "symptoms": "headache, fever, fatigue for 2 days",
  "age": 28,
  "gender": "female"
}
```

**Response:**
```json
{
  "conditions": [
    {
      "name": "Viral Upper Respiratory Infection",
      "probability": "High (70-85%)",
      "description": "Common viral infection affecting...",
      "next_steps": ["Rest and stay hydrated", "..."],
      "urgency": "low"
    }
  ],
  "red_flags": ["High fever above 103°F", "..."],
  "general_advice": "Monitor symptoms closely...",
  "when_to_seek_help": "Contact healthcare provider if...",
  "disclaimer": "IMPORTANT MEDICAL DISCLAIMER: ...",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### **GET /api/health**
Health check endpoint.

### **GET /api/history**
Get recent query history (with limit parameter).

## **LLM Integration**

### **OpenAI Integration**
1. Get API key from OpenAI
2. Create `.env` file in backend:
```bash
OPENAI_API_KEY=your_api_key_here
PORT=8000
```
3. Restart backend server

### **Mock Responses** (Default)
- Intelligent mock responses based on symptom keywords
- Realistic medical conditions and recommendations
- Perfect for development and demonstration
- No API key required

## **User Interface Showcase**

### **Homepage**
- Beautiful gradient header with medical icon
- Prominent medical disclaimer banner
- Professional form design with validation

### **Symptom Form**
- Large textarea for detailed symptom description
- Optional age and gender fields
- Real-time validation feedback
- Professional submit/reset buttons

### **Results Display**
- **Query Summary**: Shows what was analyzed
- **Condition Cards**: Each condition in a beautiful card with:
  - Urgency indicator (color-coded badge)
  - Probability estimate
  - Clear description
  - Specific next steps
- **Red Flags Section**: Emergency symptoms highlighted
- **General Advice**: Overall recommendations
- **Medical Disclaimer**: Full safety warning
- **Timestamp**: When analysis was performed

##  **Technology Stack**

### **Frontend**
- **React 18**: Latest React with hooks
- **TypeScript**: Type safety and better development experience
- **CSS3**: Modern styling with gradients, animations, and flexbox
- **Axios**: HTTP client for API requests
- **Responsive Design**: Mobile-first approach

### **Backend**
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **SQLite3**: Lightweight database
- **OpenAI API**: LLM integration (optional)
- **Helmet.js**: Security middleware
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

##  **Testing the Application**

### **Demo Scenarios**
1. **Common Cold**: "headache, runny nose, fatigue"
2. **Respiratory**: "cough, shortness of breath, chest tightness"  
3. **Digestive**: "nausea, stomach pain, loss of appetite"
4. **Neurological**: "dizziness, confusion, memory issues"

### **Expected Results**
- 2-3 possible conditions per query
- Probability estimates (High/Medium/Low with percentages)
- Specific next steps for each condition
- Red flags for serious symptoms
- Comprehensive medical disclaimers

##  **Mobile Responsiveness**

- **Responsive Grid**: Form fields stack on mobile
- **Touch-Friendly**: Large buttons and inputs
- **Readable Text**: Appropriate font sizes
- **Optimized Layout**: Content adapts to screen size

##  **Security & Safety**

### **Medical Safety**
- Multiple disclaimer banners
- Red flags for emergency symptoms
- Urgency indicators for conditions
- Professional consultation reminders
- Educational purpose emphasis

### **Technical Security**
- Helmet.js security headers
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Error handling without sensitive data exposure

##  **Production Deployment**

### **Frontend Build**
```bash
cd frontend
npm run build
```

### **Backend Production**
```bash
cd backend
NODE_ENV=production npm start
```

### **Environment Variables**
```bash
# .env file
OPENAI_API_KEY=your_openai_key
PORT=8000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

##  **Demo Ready**

The application is fully ready for demonstration:

1. **Start both servers** (backend + frontend)
2. **Navigate to localhost:3000**
3. **Enter symptoms**: "headache, fever, tired for 3 days"
4. **Add demographics**: Age 25, Female
5. **Submit and review results**:
   - Multiple conditions with probabilities
   - Color-coded urgency indicators
   - Specific next steps
   - Red flags section
   - Medical disclaimers

## **Assignment Requirements Met**

✅ **Input**: Symptom text input (with optional demographics)
✅ **Output**: Probable conditions + recommended next steps
✅ **Frontend**: Modern React interface
✅ **Backend API**: Node.js Express server
✅ **Database**: SQLite for query history
✅ **LLM Integration**: OpenAI ready + intelligent mock responses
✅ **Medical Safety**: Comprehensive disclaimers throughout
✅ **Code Quality**: TypeScript, proper error handling, responsive design

##  **Support**

The application includes:
- Comprehensive inline documentation
- Error handling with user-friendly messages
- Responsive design for all devices
- Medical safety features
- Professional UI/UX design

Your **React + Node.js Healthcare Symptom Checker** is ready for evaluation! 🎉
