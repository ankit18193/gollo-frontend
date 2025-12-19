import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext.jsx'; 
import api from '../../api/axios.js'; 

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const response = await api.post("/auth/register", {
        name: username, 
        email,
        password
      });

      if (response.data.success) {
        
        login(response.data.token, response.data.user);
        navigate("/"); 
      }
    } catch (err) {
      console.error("Registration failed", err);
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <div style={{ background: 'white', borderRadius: '50%', padding: '5px', display:'flex' }}>
            <Bot size={28} color="black" />
        </div>
        <span>Gollo AI</span>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        
        
        {error && <div style={{color: '#ff4444', marginBottom: '10px', fontSize: '14px', textAlign: 'center'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          
          <div className="auth-input-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <input 
              type="email" 
              placeholder="Email address" 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-link">Log in</Link>
        </div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

       
        <button className="social-btn">
           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="social-icon" />
           Continue with Google
        </button>
        
        <button className="social-btn">
           <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="social-icon" />
           Continue with Microsoft Account
        </button>

      </div>
    </div>
  );
};

export default Register;