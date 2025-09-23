import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin 
                ? { email: formData.email, password: formData.password }
                : { email: formData.email, password: formData.password, username: formData.username };

            console.log('Sending request to:', `http://localhost:6969${endpoint}`);
            console.log('Payload:', payload);

            const response = await fetch(`http://localhost:6969${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('Data ', data);

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                navigate('/');
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Autentikacija', error);
            setError('Server problem, ugasen je');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='main_container'>
                <div className='livi_div'>
                    <img src="/images/pas.jpeg" alt="logo" width={"200px"} height={"200px"}/>
                </div>
                <div className='desni_div'>

                    <h1>Happening now</h1>

                    <div className="forma_prijava_login">
                        <form onSubmit={handleSubmit}>
                            <h3>{isLogin ? 'Sign in to X' : 'Join X today'}</h3>
                            
                            {error && <div className="error-message">{error}</div>}
                            
                            <input 
                                type="email" 
                                name="email"
                                placeholder='Email'
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            
                            <input 
                                type="password" 
                                name="password"
                                placeholder='Password'
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            
                            {!isLogin && (
                                <input 
                                    type="text" 
                                    name="username"
                                    placeholder='Username'
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            )}
                            
                            <button type='submit' disabled={loading}>
                                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
                            </button>
                            
                            <p> OR </p>
                            
                            <button 
                                type="button" 
                                onClick={() => setIsLogin(!isLogin)}
                                className="secondary-btn"
                            >
                                {isLogin ? 'Create account' : 'Sign in instead'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;