import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User } from 'lucide-react';
import { signup } from '../utils/api';
import { requestLocationPermission } from '../utils/location';

function Signup({ onSignup }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Create account
            const response = await signup({ name, email, password });

            // Request location permission
            try {
                await requestLocationPermission();
                alert('Location permission granted! Your location will be tracked for safety features.');
            } catch (locError) {
                console.warn('Location permission denied:', locError);
                alert('Location permission is required for full functionality. You can enable it in your browser settings.');
            }

            // Login user
            onSignup(response.data.access_token, response.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
            <div className="glass-card-strong max-w-md w-full p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="bg-electric-blue/20 p-4 rounded-full">
                        <Shield className="w-12 h-12 text-electric-blue" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-electric-blue to-neon-blue bg-clip-text text-transparent">
                    Join SafeZone
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    Create your safety network account
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-danger-red/20 border border-danger-red rounded-lg text-danger-red text-sm">
                        {error}
                    </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Create a password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-6"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center mt-6 text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-electric-blue hover:text-neon-blue transition-colors">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
