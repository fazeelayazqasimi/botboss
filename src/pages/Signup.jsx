import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (role === 'company' && !formData.companyName) {
      setError('Company name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be minimum 6 characters!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: role,
          companyName: formData.companyName || undefined,
          website: formData.website || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account successfully created! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Signup failed!');
      }
    } catch (err) {
      setError('Server not connected!');
      console.error('Error:', err);
    }
  };

  return (
    <div style={authContainer}>
      <div style={authBox}>
        {step === 1 ? (
          // STEP 1: Role Selection
          <div style={roleSelectionContainer}>
            <h2 style={heading}>Join BotBoss</h2>
            <p style={subheading}>Select your role</p>
            
            <div style={roleCardsContainer}>
              {/* Job Seeker Card */}
              <div 
                style={roleCard} 
                onClick={() => handleRoleSelect('seeker')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 255, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={roleIcon}>👤</div>
                <h3 style={roleTitle}>Job Seeker</h3>
                <p style={roleDescription}>
                  Looking for a job? Get your dream job with AI-powered interviews!
                </p>
                <div style={roleBenefits}>
                  <div style={benefit}>✓ Browse jobs</div>
                  <div style={benefit}>✓ AI video interviews</div>
                  <div style={benefit}>✓ Instant feedback</div>
                </div>
              </div>

              {/* Company Card */}
              <div 
                style={{...roleCard, ...companyCard}} 
                onClick={() => handleRoleSelect('company')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 255, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={roleIcon}>🏢</div>
                <h3 style={roleTitle}>Company / Employer</h3>
                <p style={roleDescription}>
                  Looking for talented candidates? Make hiring process fast and easy with AI!
                </p>
                <div style={roleBenefits}>
                  <div style={benefit}>✓ Post jobs</div>
                  <div style={benefit}>✓ AI screening</div>
                  <div style={benefit}>✓ Detailed reports</div>
                </div>
              </div>
            </div>

            <p style={authLink}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={linkText}>
                Login
              </span>
            </p>
          </div>
        ) : (
          // STEP 2: Registration Form
          <div>
            <div style={backButton} onClick={() => setStep(1)}>
              ← Back
            </div>
            
            <div style={formHeader}>
              <div style={roleIndicator}>
                {role === 'seeker' ? '👤' : '🏢'}
              </div>
              <h2 style={heading}>
                Create {role === 'seeker' ? 'Job Seeker' : 'Company'} Account
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formGroup}>
                <label style={label}>{role === 'seeker' ? 'Your Name' : 'Contact Person Name'}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  style={input}
                />
              </div>

              {role === 'company' && (
                <>
                  <div style={formGroup}>
                    <label style={label}>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      style={input}
                    />
                  </div>

                  <div style={formGroup}>
                    <label style={label}>Website (Optional)</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="www.company.com"
                      style={input}
                    />
                  </div>
                </>
              )}

              <div style={formGroup}>
                <label style={label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  style={input}
                />
              </div>

              <div style={formGroup}>
                <label style={label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={input}
                />
              </div>

              <div style={formGroup}>
                <label style={label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={input}
                />
              </div>

              {error && <div style={errorMessage}>{error}</div>}
              {success && <div style={successMessage}>{success}</div>}

              <button type="submit" style={submitButton}>
                Create Account
              </button>
            </form>

            <p style={authLink}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={linkText}>
                Login
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Dark Theme Styles with Neon Green Accents
const authContainer = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
  padding: '24px',
  fontFamily: "'Inter', sans-serif",
};

const authBox = {
  background: '#0f0f0f',
  borderRadius: '24px',
  padding: '48px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  maxWidth: '900px',
  width: '100%',
  border: '1px solid #1a1a1a',
};

const roleSelectionContainer = {
  textAlign: 'center',
};

const heading = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#ffffff',
  marginBottom: '8px',
  textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
};

const subheading = {
  fontSize: '18px',
  color: '#cccccc',
  marginBottom: '40px',
};

const roleCardsContainer = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
  marginBottom: '32px',
};

const roleCard = {
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
  padding: '32px',
  borderRadius: '20px',
  border: '2px solid #333',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const companyCard = {
  background: 'linear-gradient(135deg, #1a2a1a 0%, #2a3a2a 100%)',
  border: '2px solid #00ff00',
};

const roleIcon = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '40px',
  margin: '0 auto 20px',
  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
  border: '2px solid #00ff00',
  color: '#00ff00',
};

const roleTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
  marginBottom: '12px',
  textShadow: '0 0 5px rgba(0, 255, 0, 0.3)',
};

const roleDescription = {
  fontSize: '15px',
  color: '#cccccc',
  lineHeight: '1.6',
  marginBottom: '20px',
};

const roleBenefits = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const benefit = {
  fontSize: '14px',
  color: '#00ff00',
  textAlign: 'left',
  paddingLeft: '8px',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

const backButton = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#00ff00',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '24px',
  fontSize: '14px',
  transition: 'color 0.2s',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

const formHeader = {
  textAlign: 'center',
  marginBottom: '32px',
};

const roleIndicator = {
  fontSize: '48px',
  marginBottom: '16px',
  textShadow: '0 0 15px rgba(0, 255, 0, 0.7)',
};

const formGroup = {
  marginBottom: '20px',
};

const label = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#cccccc',
  marginBottom: '8px',
};

const input = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '16px',
  background: '#1a1a1a',
  color: '#ffffff',
  border: '2px solid #333',
  borderRadius: '12px',
  transition: 'all 0.2s',
  outline: 'none',
  fontFamily: "'Inter', sans-serif",
};

const inputFocus = {
  border: '2px solid #00ff00',
  boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
};

const errorMessage = {
  background: 'rgba(255, 0, 0, 0.1)',
  color: '#ff4444',
  padding: '12px 16px',
  borderRadius: '10px',
  marginBottom: '16px',
  fontSize: '14px',
  border: '1px solid rgba(255, 0, 0, 0.3)',
  textShadow: '0 0 3px rgba(255, 0, 0, 0.3)',
};

const successMessage = {
  background: 'rgba(0, 255, 0, 0.1)',
  color: '#00ff00',
  padding: '12px 16px',
  borderRadius: '10px',
  marginBottom: '16px',
  fontSize: '14px',
  border: '1px solid rgba(0, 255, 0, 0.3)',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

const submitButton = {
  width: '100%',
  padding: '16px',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
  color: '#00ff00',
  border: '2px solid #00ff00',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
  textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
};

const authLink = {
  textAlign: 'center',
  marginTop: '24px',
  fontSize: '14px',
  color: '#cccccc',
};

const linkText = {
  cursor: 'pointer',
  color: '#00ff00',
  fontWeight: '600',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

export default Signup;