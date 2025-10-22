/* eslint-disable */
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Upload, MapPin, Tag, Link as LinkIcon, AlertCircle, CheckCircle, X, FileText, Clock, Shield } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';

const NewsSubmission = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general',
        mediaType: 'article',
        url: '',
        tags: '',
        mediaFile: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [submittedReport, setSubmittedReport] = useState(null);
    const [errors, setErrors] = useState({});

    const categories = [
        { value: 'politics', label: 'Politics' },
        { value: 'economy', label: 'Economy' },
        { value: 'technology', label: 'Technology' },
        { value: 'health', label: 'Health' },
        { value: 'environment', label: 'Environment' },
        { value: 'social', label: 'Social' },
        { value: 'international', label: 'International' },
        { value: 'local', label: 'Local' }
    ];

    const mediaTypes = [
        { value: 'article', label: 'Article' },
        { value: 'video', label: 'Video' },
        { value: 'image', label: 'Image' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'broadcast', label: 'Broadcast' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    mediaFile: 'File size must be less than 10MB'
                }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                mediaFile: file
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        } else if (formData.content.length < 10) {
            newErrors.content = 'Content must be at least 10 characters';
        }

        if (formData.mediaType !== 'article' && !formData.url && !formData.mediaFile) {
            newErrors.media = 'URL or file is required for this media type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const submitData = new FormData();

            // Add basic fields
            submitData.append('user', user?.email || 'anonymous');
            submitData.append('source', user?.email || 'anonymous');
            submitData.append('title', formData.title);
            submitData.append('content', formData.content);
            submitData.append('category', formData.category);
            submitData.append('mediaType', formData.mediaType);

            if (formData.url) {
                submitData.append('url', formData.url);
            }

            if (formData.tags) {
                const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                submitData.append('tags', JSON.stringify(tagsArray));
            }

            if (formData.mediaFile) {
                submitData.append('mediaFile', formData.mediaFile);
            }

            // Get current location if available
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        submitData.append('latitude', position.coords.latitude);
                        submitData.append('longitude', position.coords.longitude);
                    },
                    (error) => {
                        console.log('Location not available:', error);
                    },
                    { timeout: 10000 }
                );
            }

            const response = await apiClient.post('/api/news/reports', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSubmitStatus({
                type: 'success',
                message: 'News report submitted successfully! It will be analyzed for integrity.'
            });

            // Store the submitted report data
            setSubmittedReport(response.data);

            // Reset form
            setFormData({
                title: '',
                content: '',
                category: 'general',
                mediaType: 'article',
                url: '',
                tags: '',
                mediaFile: null
            });

            // Remove the redirect to dashboard - stay on the page to show results

        } catch (error) {
            console.error('Submission error:', error);
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.detail || 'Failed to submit news report. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Submit News Report
                    </h1>
                    <p className="text-gray-600">
                        Share news content for community verification and integrity analysis
                    </p>
                </motion.div>

                {/* Status Messages */}
                {submitStatus && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mb-6 p-4 rounded-lg border ${
                            submitStatus.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        <div className="flex items-center">
                            {submitStatus.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 mr-2" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mr-2" />
                            )}
                            {submitStatus.message}
                        </div>
                    </motion.div>
                )}

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    {/* Title */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            News Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter the news headline"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    {/* Category and Media Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Media Type *
                            </label>
                            <select
                                name="mediaType"
                                value={formData.mediaType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {mediaTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            News Content *
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            rows={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.content ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter the full news content or description"
                        />
                        {errors.content && (
                            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                        )}
                    </div>

                    {/* URL */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Source URL
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="url"
                                name="url"
                                value={formData.url}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/news-article"
                            />
                        </div>
                    </div>

                    {/* Media File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Media File (Video/Image)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {formData.mediaFile ? (
                                <div className="flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
                                    <span className="text-gray-700">{formData.mediaFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, mediaFile: null }));
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Click to upload media file
                                    </button>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Supports images and videos up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                        {errors.mediaFile && (
                            <p className="mt-1 text-sm text-red-600">{errors.mediaFile}</p>
                        )}
                        {errors.media && (
                            <p className="mt-1 text-sm text-red-600">{errors.media}</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma-separated)
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="breaking, politics, election"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-lg ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Analyzing & Submitting...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <Newspaper className="w-5 h-5 mr-2" />
                                    Submit News Report
                                </div>
                            )}
                        </button>
                    </div>
                </motion.form>

                {/* Submitted Report Display */}
                {submittedReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 bg-white rounded-2xl shadow-lg p-8"
                    >
                        <div className="flex items-center mb-6">
                            <FileText className="w-8 h-8 text-blue-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Submission Results</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Report Details */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Information</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center">
                                            <Newspaper className="w-5 h-5 text-gray-500 mr-2" />
                                            <span className="font-medium">Title:</span>
                                            <span className="ml-2">{submittedReport.title}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Tag className="w-5 h-5 text-gray-500 mr-2" />
                                            <span className="font-medium">Category:</span>
                                            <span className="ml-2 capitalize">{submittedReport.category}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-5 h-5 text-gray-500 mr-2" />
                                            <span className="font-medium">Submitted:</span>
                                            <span className="ml-2">{new Date(submittedReport.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Integrity Analysis */}
                                {submittedReport.integrity_analysis && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrity Analysis</h3>
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                                                <span className="font-medium">Integrity Score:</span>
                                                <span className={`ml-2 font-bold ${
                                                    submittedReport.integrity_analysis.score >= 80 ? 'text-green-600' :
                                                    submittedReport.integrity_analysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {submittedReport.integrity_analysis.score}/100
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                {submittedReport.integrity_analysis.summary}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Verification Status */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Status</h3>
                                    <div className={`rounded-lg p-4 ${
                                        submittedReport.verification_status === 'verified' ? 'bg-green-50 border border-green-200' :
                                        submittedReport.verification_status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                                        'bg-red-50 border border-red-200'
                                    }`}>
                                        <div className="flex items-center">
                                            {submittedReport.verification_status === 'verified' ? (
                                                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                                            ) : submittedReport.verification_status === 'pending' ? (
                                                <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                                            )}
                                            <span className="font-medium capitalize">
                                                {submittedReport.verification_status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2">
                                            {submittedReport.verification_status === 'verified'
                                                ? 'This report has been verified by the community and AI analysis.'
                                                : submittedReport.verification_status === 'pending'
                                                ? 'This report is being reviewed by the community and AI systems.'
                                                : 'This report requires additional verification or has been flagged for review.'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Community Verification */}
                                {submittedReport.community_verifications && submittedReport.community_verifications.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Verifications</h3>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                <span className="font-medium">
                                                    {submittedReport.community_verifications.length} verification{submittedReport.community_verifications.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Community members have reviewed and verified this report.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setSubmittedReport(null)}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Submit Another Report
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View in Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default NewsSubmission;