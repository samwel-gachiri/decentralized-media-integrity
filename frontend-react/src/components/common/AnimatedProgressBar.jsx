import React from 'react';
import { motion } from 'framer-motion';
import { useProgressAnimation, useScrollAnimation } from '../../hooks/useAnimations';

const AnimatedProgressBar = ({
    progress,
    height = 8,
    color = 'primary',
    backgroundColor = 'neutral-200',
    showLabel = false,
    label = '',
    duration = 1000,
    className = '',
    triggerOnScroll = true,
    threshold = 0.3,
    animated = true
}) => {
    const [scrollRef, isVisible] = useScrollAnimation(threshold, true);
    const animatedProgress = useProgressAnimation(
        (triggerOnScroll ? isVisible : true) ? progress : 0,
        duration
    );

    const colorClasses = {
        primary: 'bg-primary-600',
        secondary: 'bg-secondary-600',
        success: 'bg-success-600',
        warning: 'bg-warning-600',
        error: 'bg-error-600',
        accent: 'bg-accent-600'
    };

    const backgroundColorClasses = {
        'neutral-100': 'bg-neutral-100',
        'neutral-200': 'bg-neutral-200',
        'neutral-300': 'bg-neutral-300'
    };

    return (
        <div ref={scrollRef} className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700">
                        {label}
                    </span>
                    <span className="text-sm font-medium text-neutral-600">
                        {Math.round(animated ? animatedProgress : progress)}%
                    </span>
                </div>
            )}

            <div
                className={`w-full rounded-full overflow-hidden ${backgroundColorClasses[backgroundColor]}`}
                style={{ height: `${height}px` }}
            >
                <motion.div
                    className={`h-full rounded-full ${colorClasses[color]} relative overflow-hidden`}
                    initial={{ width: 0 }}
                    animate={{
                        width: `${animated ? animatedProgress : progress}%`
                    }}
                    transition={{
                        duration: animated ? duration / 1000 : 0,
                        ease: "easeOut",
                        delay: triggerOnScroll ? 0.2 : 0
                    }}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: 1
                        }}
                        style={{ width: '50%' }}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default AnimatedProgressBar;