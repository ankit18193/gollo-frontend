import React, { useState, useEffect } from 'react'; 
import { Bot, Github, Linkedin } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  
  useEffect(() => {
   
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userData = params.get("user");
    const errorMsg = params.get("error");

    if (token && userData) {
      try {
        
        const user = JSON.parse(decodeURIComponent(userData));
        
        
        login(token, user);
        
        
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Social Login Parse Error:", err);
        setError("Failed to process login data.");
      }
    } else if (errorMsg) {
      setError("Social login failed. Please try again.");
    }
  }, []); 

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      if (res.success) {
        login(res.token, res.user);
        navigate("/");
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  
  const handleSocialLogin = (provider) => {
    
    window.open(`http://localhost:5000/api/auth/${provider}`, "_self");
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
        <h1 className="auth-title">Welcome back</h1>

        {error && (
          <p style={{ color: "#ef4444", marginBottom: "10px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
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
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? 
          <a href="/register" className="auth-link">Sign up</a>
        </div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        
        <button className="social-btn" onClick={() => handleSocialLogin('google')}>
           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="social-icon" />
           Continue with Google
        </button>
        
        
        <button className="social-btn" onClick={() => handleSocialLogin('microsoft')}>
           <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="social-icon" />
           Continue with Microsoft Account
        </button>

        
        <button className="social-btn" onClick={() => handleSocialLogin('github')} style={{background: '#24292e', color: 'white', border: 'none'}}>
           <Github size={20} className="social-icon" style={{marginRight: '12px'}} />
           Continue with GitHub
        </button>

        
        

      </div>
    </div>
  );
};

export default Login;