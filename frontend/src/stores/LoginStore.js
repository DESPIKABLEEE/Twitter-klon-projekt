import { makeAutoObservable } from 'mobx';

class LoginStore {
    isLogin = true;
    formData = {
        email: '',
        password: '',
        username: ''
    };
    loading = false;
    error = '';
    fieldErrors = {};

    constructor() {
        makeAutoObservable(this);
    }

    setIsLogin = (value) => {
        this.isLogin = value;
        this.error = '';
        this.fieldErrors = {};
    };

    setFormData = (field, value) => {
        this.formData[field] = value;
        if (this.fieldErrors[field]) {
            delete this.fieldErrors[field];
        }
    };

    setFormDataAll = (data) => {
        this.formData = { ...data };
    };

    setLoading = (value) => {
        this.loading = value;
    };

    setError = (error) => {
        this.error = error;
    };

    setFieldErrors = (errors) => {
        this.fieldErrors = errors;
    };

    resetForm = () => {
        this.formData = {
            email: '',
            password: '',
            username: ''
        };
        this.error = '';
        this.fieldErrors = {};
    };

    validateForm = () => {
        const errors = {};

        if (!this.formData.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!this.formData.password) {
            errors.password = 'Password is required';
        } else if (this.formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
        }

        if (!this.isLogin) {
            if (!this.formData.username) {
                errors.username = 'Username is required';
            } else if (this.formData.username.length < 3) {
                errors.username = 'Username must be at least 3 characters long';
            } else if (!/^[a-zA-Z0-9_]+$/.test(this.formData.username)) {
                errors.username = 'Username can only contain letters, numbers, and underscores';
            }
        }

        this.setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
}

export default LoginStore;