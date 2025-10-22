import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({
    size = 'md',
    color = 'primary',
    className = '',
    text = null
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const colorClasses = {
        primary: 'text-primary-600',
        secondary: 'text-secondary-600',
        accent: 'text-accent-600',
        neutral: 'text-neutral-600',
        white: 'text-white'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <motion.div
                className={`${sizeClasses[size]} ${colorClasses[color]}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <svg
                    className="w-full h-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="31.416"
                        strokeDashoffset="31.416"
                        className="opacity-25"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="31.416"
                        strokeDashoffset="23.562"
                        className="opacity-75"
                    />
                </svg>
            </motion.div>
            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`mt-2 text-sm ${colorClasses[color]} opacity-75`}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;