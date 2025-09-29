import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react';
import { loginStore } from '../stores';
import './Login.css'

const Login = observer(() => {
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        loginStore.setFormData(e.target.name, e.target.value);
        loginStore.setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!loginStore.validateForm()) {
            return;
        }

        loginStore.setLoading(true);
        loginStore.setError('');

        try {
            const endpoint = loginStore.isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = loginStore.isLogin 
                ? { email: loginStore.formData.email, password: loginStore.formData.password }
                : { email: loginStore.formData.email, password: loginStore.formData.password, username: loginStore.formData.username };

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
                loginStore.setError(data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Autentikacija', error);
            loginStore.setError('Server problem, ugasen je');
        } finally {
            loginStore.setLoading(false);
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
                            <h3>{loginStore.isLogin ? 'Sign in to X' : 'Join X today'}</h3>
                            
                            {loginStore.error && <div className="error-message">{loginStore.error}</div>}
                            
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    name="email"
                                    placeholder='Email'
                                    value={loginStore.formData.email}
                                    onChange={handleInputChange}
                                    className={loginStore.fieldErrors.email ? 'error' : ''}
                                />
                                {loginStore.fieldErrors.email && <span className="field-error">{loginStore.fieldErrors.email}</span>}
                            </div>
                            
                            {!loginStore.isLogin && (
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        name="username"
                                        placeholder='Username'
                                        value={loginStore.formData.username}
                                        onChange={handleInputChange}
                                        className={loginStore.fieldErrors.username ? 'error' : ''}
                                    />
                                    {loginStore.fieldErrors.username && <span className="field-error">{loginStore.fieldErrors.username}</span>}
                                </div>
                            )}
                            
                            <div className="input-group">
                                <input 
                                    type="password" 
                                    name="password"
                                    placeholder='Password'
                                    value={loginStore.formData.password}
                                    onChange={handleInputChange}
                                    className={loginStore.fieldErrors.password ? 'error' : ''}
                                />
                                {loginStore.fieldErrors.password && <span className="field-error">{loginStore.fieldErrors.password}</span>}
                            </div>
                            
                            <button type='submit' disabled={loginStore.loading}>
                                {loginStore.loading ? 'Processing...' : (loginStore.isLogin ? 'Sign in' : 'Create account')}
                            </button>
                            
                            <p> OR </p>
                            
                            <button 
                                type="button" 
                                onClick={() => loginStore.setIsLogin(!loginStore.isLogin)}
                                className="secondary-btn"
                            >
                                {loginStore.isLogin ? 'Create account' : 'Sign in instead'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Login;