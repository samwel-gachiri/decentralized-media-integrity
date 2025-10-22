import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { LoadingSpinner } from '../ui';

const AnimatedButton = ({
    children,
    loading = false,
    success = false,
    error = false,
    animation = 'default',
    className = '',
    disabled,
    onClick,
    ...props
}) => {
    const animations = {
        default: {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 },
            transition: { duration: 0.2 }
        },
        bounce: {
            whileHover: { scale: 1.05, y: -2 },
            whileTap: { scale: 0.95, y: 0 },
            transition: { type: "spring", stiffness: 400, damping: 17 }
        },
        glow: {
            whileHover: {
                boxShadow: "0 0 20px rgba(37, 99, 235, 0.4)",
                scale: 1.02
            },
            whileTap: { scale: 0.98 },
            transition: { duration: 0.2 }
        },
        pulse: {
            animate: loading ? { scale: [1, 1.05, 1] } : { scale: 1 },
            transition: loading ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            } : { duration: 0.2 }
        },
        shake: {
            animate: error ? {
                x: [0, -10, 10, -10, 10, 0]
            } : { x: 0 },
            transition: error ? {
                duration: 0.5,
                ease: "easeInOut"
            } : { duration: 0.2 }
        },
        success: {
            animate: success ? {
                scale: [1, 1.1, 1],
                backgroundColor: ["#10b981", "#22c55e", "#10b981"]
            } : { scale: 1 },
            transition: success ? {
                duration: 0.6,
                ease: "easeInOut"
            } : { duration: 0.2 }
        }
    };

    const getAnimationProps = () => {
        if (typeof animation === 'string') {
            return animations[animation] || animations.default;
        }
        return animation;
    };

    const handleClick = (e) => {
        if (loading || disabled) return;
        onClick?.(e);
    };

    const buttonContent = () => {
        if (loading) {
            return (
                <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Loading...</span>
                </div>
            );
        }

        if (success) {
            return (
                <div className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        ✓
                    </motion.div>
                    <span>Success!</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        ✗
                    </motion.div>
                    <span>Error</span>
                </div>
            );
        }

        return children;
    };

    return (
        <motion.div
            {...getAnimationProps()}
            className={className}
        >
            <Button
                disabled={loading || disabled}
                onClick={handleClick}
                className={`
          relative overflow-hidden transition-all duration-200
          ${loading ? 'cursor-wait' : ''}
          ${success ? 'bg-success-600 hover:bg-success-700' : ''}
          ${error ? 'bg-error-600 hover:bg-error-700' : ''}
        `}
                {...props}
            >
                {/* Ripple effect */}
                <motion.div
                    className="absolute inset-0 bg-white/20 rounded-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                />

                {/* Button content */}
                <motion.div
                    className="relative z-10"
                    animate={loading ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
                    transition={loading ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    } : { duration: 0.2 }}
                >
                    {buttonContent()}
                </motion.div>
            </Button>
        </motion.div>
    );
};

export default AnimatedButton;