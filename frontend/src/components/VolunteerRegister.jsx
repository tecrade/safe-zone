import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import { registerVolunteer } from '../utils/api';

const volunteerTypes = [
    'Emergency Medical Responder',
    'Auxiliary Police Officer',
    'Crisis Intervention Specialist',
    'Medical Reserve Corps Volunteer',
    'Victim Advocate'
];

function VolunteerRegister({ user, onUpdateUser }) {
    const [selectedType, setSelectedType] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedType) {
            alert('Please select a volunteer type');
            return;
        }

        setLoading(true);
        try {
            await registerVolunteer(selectedType);

            // Update local user state
            const updatedUser = { ...user, is_volunteer: true, volunteer_type: selectedType };
            // Ensure we keep the token
            const token = localStorage.getItem('token');
            if (onUpdateUser) {
                onUpdateUser(token, updatedUser);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error registering as volunteer:', error);
            alert('Failed to register as volunteer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-bg">
                <div className="glass-card-strong max-w-md w-full p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="w-16 h-16 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-gray-400">You are now registered as a volunteer.</p>
                    <p className="text-gray-400">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
            <div className="glass-card-strong max-w-2xl w-full p-8">
                {/* Header */}
                <div className="flex justify-center mb-6">
                    <div className="bg-emerald/20 p-4 rounded-full">
                        <Shield className="w-12 h-12 text-emerald" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald to-electric-blue bg-clip-text text-transparent">
                    Become a Volunteer
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    Help your community by responding to emergency requests
                </p>

                {/* Info Box */}
                <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-300">
                        As a volunteer, you'll receive notifications when someone nearby needs help.
                        You can accept requests and provide assistance based on your expertise.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium mb-3 text-gray-300">
                        Select Your Volunteer Type
                    </label>

                    <div className="space-y-3 mb-6">
                        {volunteerTypes.map((type) => (
                            <div
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`glass-card p-4 cursor-pointer transition-all ${selectedType === type
                                    ? 'border-electric-blue shadow-glow-blue'
                                    : 'border-transparent hover:border-neon-blue/50'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedType === type
                                            ? 'border-electric-blue bg-electric-blue'
                                            : 'border-gray-400'
                                            }`}
                                    >
                                        {selectedType === type && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-white font-medium">{type}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 bg-navy-medium hover:bg-midnight px-6 py-3 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedType}
                            className="flex-1 btn-success"
                        >
                            {loading ? 'Registering...' : 'Register as Volunteer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default VolunteerRegister;
