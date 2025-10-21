import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react';
import { loginStore, userStore } from '../stores';
import { getApiBaseUrl } from '../config/api';
import './Login.css'

const Login = observer(() => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        userStore.handleGoogleOAuth(searchParams, navigate);
    }, [searchParams, navigate]);

    const handleInputChange = (e) => {
        loginStore.setFormData(e.target.name, e.target.value);
        loginStore.setError('');
    };

    const handleGoogleLogin = () => {
        window.location.href = `${getApiBaseUrl()}/auth/google`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!loginStore.validateForm()) {
            return;
        }

        try {
            const credentials = loginStore.isLogin 
                ? { email: loginStore.formData.email, password: loginStore.formData.password }
                : { email: loginStore.formData.email, password: loginStore.formData.password, username: loginStore.formData.username };

            if (loginStore.isLogin) {
                await userStore.loginUser(credentials);
            } else {
                await userStore.registerUser(credentials);
            }
            
            navigate('/');
        } catch (error) {
            loginStore.setError(error.message || 'Something went wrong');
        }
    };

    return (
        <div>
            <div className='main_container'>
                <div className='livi_div'>
                    <img src="/images/twitter.png" alt="logo" width={"200px"} height={"200px"}/>
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
                                onClick={handleGoogleLogin}
                                className="google-login-btn"
                            >
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>
                            
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