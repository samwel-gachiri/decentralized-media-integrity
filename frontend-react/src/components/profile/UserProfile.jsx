import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X, Camera, MapPin, Calendar, Award, TrendingUp } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Badge from '../ui/Badge.jsx';

const UserProfile = ({ user, onUpdate, isLoading = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        locationRegion: user?.locationRegion || '',
        profileImage: user?.profileImage || ''
    });
    const [errors, setErrors] = useState({});

    const handleEdit = () => {
        setIsEditing(true);
        setEditData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            locationRegion: user?.locationRegion || '',
            profileImage: user?.profileImage || ''
        });
        setErrors({});
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            locationRegion: user?.locationRegion || '',
            profileImage: user?.profileImage || ''
        });
        setErrors({});
    };

    const handleSave = async () => {
        // Basic validation
        const newErrors = {};
        if (!editData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!editData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!editData.locationRegion.trim()) newErrors.locationRegion = 'Location is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onUpdate(editData);
            setIsEditing(false);
            setErrors({});
        } catch (error) {
            setErrors({ general: 'Failed to update profile. Please try again.' });
        }
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const getTrustScoreColor = (score) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 80) return 'bg-blue-500';
        if (score >= 60) return 'bg-amber-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getTrustScoreLabel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'High';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Low';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                                )}
                            </div>
                            {isEditing && (
                                <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                                    <Camera className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <Input
                                            value={editData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            placeholder="First name"
                                            className="w-32"
                                            error={errors.firstName}
                                        />
                                        <Input
                                            value={editData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            placeholder="Last name"
                                            className="w-32"
                                            error={errors.lastName}
                                        />
                                    </div>
                                    {(errors.firstName || errors.lastName) && (
                                        <p className="text-red-500 text-sm">{errors.firstName || errors.lastName}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </h1>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge variant={user.role === 'researcher' ? 'primary' : 'secondary'}>
                                    {user.role === 'researcher' ? 'Researcher' : 'User'}
                                </Badge>
                                <Badge variant="outline" className="flex items-center space-x-1">
                                    <Award className="w-3 h-3" />
                                    <span>{getTrustScoreLabel(user.trustScore)}</span>
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {isEditing ? (
                            <>
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex items-center space-x-1"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex items-center space-x-1"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleEdit}
                                variant="outline"
                                className="flex items-center space-x-1"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </Button>
                        )}
                    </div>
                </div>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {errors.general}
                    </div>
                )}

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Location</p>
                                {isEditing ? (
                                    <div>
                                        <Input
                                            value={editData.locationRegion}
                                            onChange={(e) => handleInputChange('locationRegion', e.target.value)}
                                            placeholder="Location region"
                                            error={errors.locationRegion}
                                        />
                                        {errors.locationRegion && (
                                            <p className="text-red-500 text-sm mt-1">{errors.locationRegion}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="font-medium">{user.locationRegion}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="font-medium">{formatDate(user.createdAt || user.created_at)}</p>
                            </div>
                        </div>

                        {(user.lastLoginAt || user.last_login_at) && (
                            <div className="flex items-center space-x-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Last Active</p>
                                    <p className="font-medium">{formatDate(user.lastLoginAt || user.last_login_at)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Trust Score */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Trust Score</p>
                                <span className="text-lg font-bold text-gray-900">{user.trustScore || user.trust_score || 50}/100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <motion.div
                                    className={`h-3 rounded-full ${getTrustScoreColor(user.trustScore || user.trust_score || 50)}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${user.trustScore || user.trust_score || 50}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {/* Quick Stats */}
                        {user.stats && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{user.stats.totalEvents}</p>
                                    <p className="text-sm text-gray-600">Events Reported</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{user.stats.verifiedEvents}</p>
                                    <p className="text-sm text-gray-600">Verified</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Statistics Section */}
            {user.stats && (
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Performance Statistics</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">{user.stats.totalEvents}</p>
                            <p className="text-sm text-gray-600 mt-1">Total Events</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">{user.stats.verifiedEvents}</p>
                            <p className="text-sm text-gray-600 mt-1">Verified Events</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                            <p className="text-3xl font-bold text-purple-600">
                                {user.stats.verificationRate ? `${(user.stats.verificationRate * 100).toFixed(1)}%` : '0%'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                            <p className="text-3xl font-bold text-amber-600">
                                {user.stats.totalEarnings ? `${user.stats.totalEarnings.toFixed(3)} ETH` : '0 ETH'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Total Earnings</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default UserProfile;