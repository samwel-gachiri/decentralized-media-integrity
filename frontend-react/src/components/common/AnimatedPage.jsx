import React from 'react';
import { motion } from 'framer-motion';
import { animations } from '../../utils/animations';

const AnimatedPage = ({
    children,
    animation = 'fadeInUp',
    className = '',
    delay = 0,
    stagger = false,
    ...props
}) => {
    const getAnimation = () => {
        if (typeof animation === 'string') {
            return animations[animation] || animations.fadeInUp;
        }
        return animation;
    };

    const animationProps = getAnimation();

    // Add delay if specified
    if (delay > 0) {
        animationProps.transition = {
            ...animationProps.transition,
            delay
        };
    }

    // If stagger is enabled, use stagger container
    if (stagger) {
        return (
            <motion.div
                className={className}
                variants={animations.staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                {...props}
            >
                {React.Children.map(children, (child, index) => (
                    <motion.div
                        key={index}
                        variants={animations.staggerItem}
                    >
                        {child}
                    </motion.div>
                ))}
            </motion.div>
        );
    }

    return (
        <motion.div
            className={className}
            initial={animationProps.initial}
            animate={animationProps.animate}
            exit={animationProps.exit}
            transition={animationProps.transition}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPage;