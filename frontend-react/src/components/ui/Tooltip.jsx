import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({
    children,
    content,
    position = 'top',
    delay = 500,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState(position);
    const timeoutRef = useRef(null);
    const tooltipRef = useRef(null);
    const triggerRef = useRef(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            // Calculate position based on viewport
            if (triggerRef.current && tooltipRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const tooltipRect = tooltipRef.current.getBoundingClientRect();

                let newPosition = position;

                // Check if tooltip would go off screen and adjust position
                if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
                    newPosition = 'bottom';
                } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > window.innerHeight - 10) {
                    newPosition = 'top';
                } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
                    newPosition = 'right';
                } else if (position === 'right' && triggerRect.right + tooltipRect.width > window.innerWidth - 10) {
                    newPosition = 'left';
                }

                setActualPosition(newPosition);
            }
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-900',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-900',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-neutral-900',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-neutral-900'
    };

    if (!content) return children;

    return (
        <div
            className="relative inline-block"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            ref={triggerRef}
        >
            {children}

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        ref={tooltipRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`
              absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 rounded-lg shadow-lg
              whitespace-nowrap max-w-xs ${positionClasses[actualPosition]} ${className}
            `}
                        style={{ pointerEvents: 'none' }}
                    >
                        {content}

                        {/* Arrow */}
                        <div
                            className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tooltip;