import React, { useState } from 'react';
import { registerUser, loginUser } from '../api.js';

export default function Signup({ onSignupSuccess, onGoLogin }) {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        password: '', confirmPassword: '',
        role: 'user', department: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        setError('');
        setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = 'First name is required.';
        if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
            errs.email = 'Enter a valid email.';
        if (form.password.length < 3) errs.password = 'Password must be at least 3 characters.';
        if (form.password !== form.confirmPassword)
            errs.confirmPassword = 'Passwords do not match.';
        if (!form.department.trim()) errs.department = 'Department is required.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setLoading(true);
        setError('');
        try {
            const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
            await registerUser(
                fullName, form.email.trim(), form.password,
                form.role, form.department.trim()
            );
            // Redirect to login page as requested
            onGoLogin();
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card-accent" />
                <div className="auth-card-body">
                    <div className="auth-brand">
                        <div className="auth-brand-icon">🛡️</div>
                        <h1 className="auth-title">Create account</h1>
                        <p className="auth-subtitle">Aegis HCL — Hackathon 2026</p>
                    </div>

                    <div className="auth-divider">
                        <div className="auth-divider-line" />
                        <span className="auth-divider-text">Register as a new user</span>
                        <div className="auth-divider-line" />
                    </div>

                    {error && <div className="alert-error"><span>⚠️</span> {error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Name row */}
                        <div className="form-group">
                            <div className="form-row">
                                <div>
                                    <label className="form-label" htmlFor="su-fn">First name</label>
                                    <input id="su-fn" name="firstName" type="text" autoComplete="given-name"
                                        className={`form-input${fieldErrors.firstName ? ' error' : ''}`}
                                        placeholder="John" value={form.firstName} onChange={handleChange} />
                                    {fieldErrors.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="form-label" htmlFor="su-ln">Last name</label>
                                    <input id="su-ln" name="lastName" type="text" autoComplete="family-name"
                                        className={`form-input${fieldErrors.lastName ? ' error' : ''}`}
                                        placeholder="Doe" value={form.lastName} onChange={handleChange} />
                                    {fieldErrors.lastName && <p className="field-error">{fieldErrors.lastName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="su-email">Email address</label>
                            <input id="su-email" name="email" type="email" autoComplete="email"
                                className={`form-input${fieldErrors.email ? ' error' : ''}`}
                                placeholder="you@hcl.com" value={form.email} onChange={handleChange} />
                            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                        </div>

                        {/* Department */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="su-dept">Department</label>
                            <input id="su-dept" name="department" type="text"
                                className={`form-input${fieldErrors.department ? ' error' : ''}`}
                                placeholder="e.g. IT, HR, Finance, Network"
                                value={form.department} onChange={handleChange} />
                            {fieldErrors.department && <p className="field-error">{fieldErrors.department}</p>}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="su-pw">Password</label>
                            <input id="su-pw" name="password" type="password" autoComplete="new-password"
                                className={`form-input${fieldErrors.password ? ' error' : ''}`}
                                placeholder="Minimum 3 characters" value={form.password} onChange={handleChange} />
                            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="su-cpw">Confirm password</label>
                            <input id="su-cpw" name="confirmPassword" type="password" autoComplete="new-password"
                                className={`form-input${fieldErrors.confirmPassword ? ' error' : ''}`}
                                placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} />
                            {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="su-role">Account type</label>
                            <div className="select-wrap">
                                <select id="su-role" name="role" className="form-select"
                                    value={form.role} onChange={handleChange}>
                                    <option value="user">Employee — Raise &amp; track tickets</option>
                                    <option value="admin">Admin — Manage all tickets</option>
                                </select>
                                <span className="select-chevron">▼</span>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading && <span className="btn-spinner" />}
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <button className="auth-link" onClick={onGoLogin}>Sign in</button>
                    </div>
                    <p className="auth-legal">AsyncNinjas · HCL Hackathon 2026</p>
                </div>
            </div>
        </div>
    );
}
