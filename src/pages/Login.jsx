import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and Password are required!');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          ...data.user,
          role: data.user.role
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        if (userData.role === 'company') {
          navigate('/CompanyDashboard');
        } else if (userData.role === 'seeker') {
          navigate('/SeekerDashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error || 'Invalid email or password!');
      }
    } catch (err) {
      setError('Server not connected!');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authContainer}>
      <div style={authBox}>
        <div style={headerSection}>
          <div style={logoContainer}>
            <div style={logo}></div>
            <h1 style={brandName}>BotBoss</h1>
          </div>
          <h2 style={heading}>Welcome Back!</h2>
          <p style={subheading}>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={form}>
          <div style={formGroup}>
            <label style={label}>Email</label>
            <div style={inputWrapper}>
              <svg style={inputIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                style={input}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #00ff00';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #333';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={formGroup}>
            <label style={label}>Password</label>
            <div style={inputWrapper}>
              <svg style={inputIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={input}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #00ff00';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #333';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={forgotPassword}>
            <span style={forgotLink}>Forgot Password?</span>
          </div>

          {error && <div style={errorMessage}>{error}</div>}

          <button 
            type="submit" 
            style={{
              ...submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }} 
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
              }
            }}
          >
            {loading ? (
              <div style={loadingContainer}>
                <div style={spinner}></div>
                <span>Logging in...</span>
              </div>
            ) : (
              <div style={buttonContent}>
                <span>Login</span>
                <svg style={buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </button>
        </form>

        <div style={divider}>
          <div style={dividerLine}></div>
          <span style={dividerText}>or</span>
          <div style={dividerLine}></div>
        </div>

        <div style={roleInfo}>
          <div style={roleInfoCard}>
            <span style={roleInfoIcon}>👤</span>
            <span style={roleInfoText}>Job Seeker Dashboard</span>
          </div>
          <div style={roleInfoCard}>
            <span style={roleInfoIcon}>🏢</span>
            <span style={roleInfoText}>Company Dashboard</span>
          </div>
        </div>

        <p style={authLink}>
          Don't have an account?{' '}
          <span 
            onClick={() => navigate('/signup')} 
            style={linkText}
            onMouseEnter={(e) => {
              e.target.style.textShadow = '0 0 8px rgba(0, 255, 0, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.target.style.textShadow = '0 0 3px rgba(0, 255, 0, 0.5)';
            }}
          >
            Sign Up
          </span>
        </p>
      </div>

      {/* Neon Glow Circles */}
      <div style={decorativeCircle1}></div>
      <div style={decorativeCircle2}></div>
      <div style={decorativeCircle3}></div>
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
  position: 'relative',
  overflow: 'hidden',
};

const authBox = {
  background: '#0f0f0f',
  borderRadius: '24px',
  padding: '48px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  maxWidth: '480px',
  width: '100%',
  position: 'relative',
  zIndex: 1,
  border: '1px solid #1a1a1a',
};

const headerSection = {
  textAlign: 'center',
  marginBottom: '32px',
};

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginBottom: '24px',
};

const logo = {
  fontSize: '48px',
  textShadow: '0 0 15px rgba(0, 255, 0, 0.7)',
  filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.5))',
};

const brandName = {
  fontSize: '32px',
  fontWeight: '700',
  color: 'linear-gradient(135deg, #00ff00 0%, #188118 100%)',

  margin: 0,
  textShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
};

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#ffffff',
  marginBottom: '8px',
  textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
};

const subheading = {
  fontSize: '16px',
  color: '#cccccc',
};

const form = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const formGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#cccccc',
};

const inputWrapper = {
  position: 'relative',
};

const inputIcon = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '20px',
  height: '20px',
  color: '#00ff00',
  pointerEvents: 'none',
  filter: 'drop-shadow(0 0 2px rgba(0, 255, 0, 0.5))',
};

const input = {
  width: '100%',
  padding: '14px 16px 14px 48px',
  fontSize: '16px',
  background: '#1a1a1a',
  color: '#ffffff',
  border: '2px solid #333',
  borderRadius: '12px',
  transition: 'all 0.2s',
  outline: 'none',
  fontFamily: "'Inter', sans-serif",
  boxSizing: 'border-box',
};

const forgotPassword = {
  textAlign: 'right',
  marginTop: '-8px',
};

const forgotLink = {
  fontSize: '14px',
  color: '#00ff00',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'all 0.2s',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

const errorMessage = {
  background: 'rgba(255, 0, 0, 0.1)',
  color: '#ff4444',
  padding: '12px 16px',
  borderRadius: '10px',
  fontSize: '14px',
  border: '1px solid rgba(255, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textShadow: '0 0 3px rgba(255, 0, 0, 0.3)',
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
  transition: 'all 0.2s',
  boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
  textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
};

const buttonContent = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const buttonIcon = {
  width: '18px',
  height: '18px',
  color: '#00ff00',
  filter: 'drop-shadow(0 0 2px rgba(0, 255, 0, 0.5))',
};

const loadingContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
};

const spinner = {
  width: '20px',
  height: '20px',
  border: '3px solid rgba(0, 255, 0, 0.3)',
  borderTop: '3px solid #00ff00',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
};

const divider = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  margin: '24px 0',
};

const dividerLine = {
  flex: 1,
  height: '1px',
  background: '#333',
};

const dividerText = {
  fontSize: '14px',
  color: '#666',
  fontWeight: '500',
};

const roleInfo = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  marginBottom: '24px',
};

const roleInfoCard = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '16px',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
  borderRadius: '12px',
  border: '2px solid #333',
  transition: 'all 0.2s',
  cursor: 'pointer',
};

const roleInfoIcon = {
  fontSize: '32px',
  filter: 'drop-shadow(0 0 5px rgba(0, 255, 0, 0.3))',
};

const roleInfoText = {
  fontSize: '12px',
  color: '#cccccc',
  fontWeight: '600',
  textAlign: 'center',
};

const authLink = {
  textAlign: 'center',
  fontSize: '14px',
  color: '#cccccc',
};

const linkText = {
  cursor: 'pointer',
  color: '#00ff00',
  fontWeight: '600',
  transition: 'all 0.2s',
  textShadow: '0 0 3px rgba(0, 255, 0, 0.5)',
};

const decorativeCircle1 = {
  position: 'absolute',
  top: '-100px',
  left: '-100px',
  width: '300px',
  height: '300px',
  background: 'radial-gradient(circle, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 0, 0) 70%)',
  borderRadius: '50%',
  filter: 'blur(40px)',
  zIndex: 0,
};

const decorativeCircle2 = {
  position: 'absolute',
  bottom: '-100px',
  right: '-100px',
  width: '400px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(0, 255, 0, 0.08) 0%, rgba(0, 255, 0, 0) 70%)',
  borderRadius: '50%',
  filter: 'blur(60px)',
  zIndex: 0,
};

const decorativeCircle3 = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, rgba(0, 255, 0, 0) 70%)',
  borderRadius: '50%',
  filter: 'blur(80px)',
  zIndex: 0,
};

// Add keyframes for spinner animation
const styles = document.createElement('style');
styles.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styles);

export default Login;