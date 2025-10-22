import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation, useNumberAnimation } from '../../hooks/useAnimations';

const AnimatedCounter = ({
    value,
    duration = 2000,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
    triggerOnScroll = true,
    threshold = 0.3
}) => {
    const [shouldAnimate, setShouldAnimate] = useState(!triggerOnScroll);
    const [scrollRef, isVisible] = useScrollAnimation(threshold, true);

    // Start animation when visible or immediately if not scroll-triggered
    useEffect(() => {
        if (triggerOnScroll && isVisible) {
            setShouldAnimate(true);
        }
    }, [isVisible, triggerOnScroll]);

    const animatedValue = useNumberAnimation(
        shouldAnimate ? value : 0,
        duration
    );

    const formatNumber = (num) => {
        if (decimals > 0) {
            return num.toFixed(decimals);
        }
        return Math.round(num).toLocaleString();
    };

    return (
        <motion.div
            ref={scrollRef}
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: triggerOnScroll ? 0.2 : 0
            }}
        >
            <motion.span
                key={animatedValue}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {prefix}{formatNumber(animatedValue)}{suffix}
            </motion.span>
        </motion.div>
    );
};

export default AnimatedCounter;