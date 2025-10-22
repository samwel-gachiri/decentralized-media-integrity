import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '../../utils/animations';

const AnimatedList = ({
    items = [],
    renderItem,
    staggerDelay = 0.1,
    animation = 'fadeInUp',
    className = '',
    itemClassName = '',
    keyExtractor = (item, index) => item.id || index,
    layout = false,
    ...props
}) => {
    const getAnimation = () => {
        if (typeof animation === 'string') {
            return animations[animation] || animations.fadeInUp;
        }
        return animation;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: staggerDelay / 2,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: getAnimation().initial,
        visible: getAnimation().animate,
        exit: getAnimation().exit || getAnimation().initial
    };

    return (
        <motion.div
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                    <motion.div
                        key={keyExtractor(item, index)}
                        variants={itemVariants}
                        className={itemClassName}
                        layout={layout}
                        transition={getAnimation().transition}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {renderItem(item, index)}
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default AnimatedList;