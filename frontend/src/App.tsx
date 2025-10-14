import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// TypeScript interfaces
interface Condition {
  name: string;
  probability: string;
  description: string;
  next_steps: string[];
  urgency: 'low' | 'medium' | 'high';
}

interface AnalysisResponse {
  conditions: Condition[];
  red_flags: string[];
  general_advice: string;
  when_to_seek_help: string;
  disclaimer: string;
  timestamp: string;
  query_info: {
    symptoms: string;
    age: number | null;
    gender: string | null;
  };
}

interface SymptomRequest {
  symptoms: string;
  age?: number;
  gender?: string;
}

const App: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_BASE_URL = 'http://localhost:8000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const requestData: SymptomRequest = {
        symptoms: symptoms.trim(),
      };

      if (age && parseInt(age) > 0) {
        requestData.age = parseInt(age);
      }

      if (gender) {
        requestData.gender = gender;
      }

      const response = await axios.post(`${API_BASE_URL}/analyze-symptoms`, requestData);
      setResults(response.data);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred while analyzing symptoms. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSymptoms('');
    setAge('');
    setGender('');
    setResults(null);
    setError('');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#d97706';
      case 'low':
        return '#059669';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Healthcare Symptom Analyzer</h1>
        <p className="subtitle">Clinical Decision Support System</p>
      </header>

      <main className="main-content">
        <form onSubmit={handleSubmit} className="symptom-form">
          <div className="form-group">
            <label htmlFor="symptoms">
              Patient Symptoms <span className="required">*</span>
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Document presenting symptoms, onset, duration, severity, and associated factors..."
              required
              rows={4}
              className="form-control"
              disabled={loading}
            />
            <small className="form-text">
              Include duration, severity, triggers, and any relevant medical history.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Patient Age</label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age in years"
                min="0"
                max="120"
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Patient Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="form-control"
                disabled={loading}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Not specified</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !symptoms.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                'Analyze Symptoms'
              )}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              className="btn btn-secondary"
              disabled={loading}
            >
              Clear Form
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <strong>Analysis Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="results-section">
            <h2>Clinical Analysis Results</h2>
            
            <div className="query-info">
              <h3>Patient Information</h3>
              <p><strong>Presenting Symptoms:</strong> {results.query_info.symptoms}</p>
              {results.query_info.age && (
                <p><strong>Age:</strong> {results.query_info.age} years</p>
              )}
              {results.query_info.gender && (
                <p><strong>Gender:</strong> {results.query_info.gender}</p>
              )}
            </div>

            <div className="conditions-list">
              <h3>Differential Diagnosis</h3>
              {results.conditions.map((condition, index) => (
                <div key={index} className="condition-card">
                  <div className="condition-header">
                    <h4>{condition.name}</h4>
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getUrgencyColor(condition.urgency) }}
                    >
                      {condition.urgency.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="probability">
                    <strong>Clinical Probability:</strong> {condition.probability}
                  </p>
                  
                  <p className="description">{condition.description}</p>
                  
                  <div className="next-steps">
                    <h5>Clinical Recommendations:</h5>
                    <ul>
                      {condition.next_steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {results.red_flags && results.red_flags.length > 0 && (
              <div className="red-flags-section">
                <h3>Critical Alert: Immediate Evaluation Required</h3>
                <ul className="red-flags-list">
                  {results.red_flags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.general_advice && (
              <div className="general-advice">
                <h3>Clinical Guidance</h3>
                <p>{results.general_advice}</p>
              </div>
            )}

            {results.when_to_seek_help && (
              <div className="seek-help">
                <h3>Referral Criteria</h3>
                <p>{results.when_to_seek_help}</p>
              </div>
            )}

            <div className="timestamp">
              <small>Analysis completed: {new Date(results.timestamp).toLocaleString()}</small>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
