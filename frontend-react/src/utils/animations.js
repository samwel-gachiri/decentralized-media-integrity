// Animation utilities for Framer Motion
export const animations = {
    // Page transitions
    pageTransition: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "easeInOut" }
    },

    // Fade animations
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
    },

    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    fadeInDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    fadeInLeft: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    fadeInRight: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    // Scale animations
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3, ease: "easeOut" }
    },

    scaleInCenter: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { duration: 0.4, ease: "backOut" }
    },

    // Slide animations
    slideInUp: {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    slideInDown: {
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    slideInLeft: {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    slideInRight: {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    // Stagger animations for lists
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    },

    staggerItem: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: "easeOut" }
    },

    // Hover animations
    hoverScale: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { duration: 0.2 }
    },

    hoverLift: {
        whileHover: { y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" },
        whileTap: { y: 0 },
        transition: { duration: 0.2 }
    },

    hoverGlow: {
        whileHover: {
            boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)",
            transition: { duration: 0.2 }
        }
    },

    // Button animations
    buttonPress: {
        whileTap: { scale: 0.95 },
        transition: { duration: 0.1 }
    },

    buttonHover: {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 }
    },

    // Loading animations
    spin: {
        animate: { rotate: 360 },
        transition: { duration: 1, repeat: Infinity, ease: "linear" }
    },

    pulse: {
        animate: { scale: [1, 1.05, 1] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },

    bounce: {
        animate: { y: [0, -10, 0] },
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
    },

    // Modal animations
    modalBackdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
    },

    modalContent: {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 },
        transition: { duration: 0.3, ease: "easeOut" }
    },

    // Toast animations
    toastSlideIn: {
        initial: { opacity: 0, x: 100, scale: 0.9 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 100, scale: 0.9 },
        transition: { duration: 0.3, ease: "easeOut" }
    },

    // Drawer animations
    drawerSlideIn: {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { duration: 0.3, ease: "easeInOut" }
    },

    drawerSlideInLeft: {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
        transition: { duration: 0.3, ease: "easeInOut" }
    },

    // Accordion animations
    accordionExpand: {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.3, ease: "easeInOut" }
    },

    // Progress animations
    progressFill: {
        initial: { width: 0 },
        animate: { width: "100%" },
        transition: { duration: 1, ease: "easeOut" }
    },

    // Typing animation
    typewriter: {
        animate: {
            width: ["0%", "100%"]
        },
        transition: {
            duration: 2,
            ease: "easeInOut"
        }
    },

    // Floating animation
    float: {
        animate: {
            y: [0, -10, 0]
        },
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    },

    // Shake animation
    shake: {
        animate: {
            x: [0, -10, 10, -10, 10, 0]
        },
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    },

    // Wiggle animation
    wiggle: {
        animate: {
            rotate: [0, -3, 3, -3, 3, 0]
        },
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    },

    // Heartbeat animation
    heartbeat: {
        animate: {
            scale: [1, 1.1, 1, 1.1, 1]
        },
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// Easing functions
export const easings = {
    easeInOut: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    backOut: [0.175, 0.885, 0.32, 1.275],
    backIn: [0.6, -0.28, 0.735, 0.045],
    circOut: [0.075, 0.82, 0.165, 1],
    circIn: [0.6, 0.04, 0.98, 0.335]
};

// Animation variants for different components
export const variants = {
    // Card variants
    card: {
        rest: { scale: 1, y: 0 },
        hover: { scale: 1.02, y: -4 },
        tap: { scale: 0.98, y: 0 }
    },

    // Button variants
    button: {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    },

    // Icon variants
    icon: {
        rest: { rotate: 0 },
        hover: { rotate: 15 },
        tap: { rotate: -15 }
    },

    // List item variants
    listItem: {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 }
    },

    // Navigation variants
    nav: {
        closed: { opacity: 0, height: 0 },
        open: { opacity: 1, height: "auto" }
    }
};

// Utility functions
export const createStaggerAnimation = (staggerDelay = 0.1, childDelay = 0) => ({
    animate: {
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: childDelay
        }
    }
});

export const createDelayedAnimation = (animation, delay = 0) => ({
    ...animation,
    transition: {
        ...animation.transition,
        delay
    }
});

export const createSpringAnimation = (stiffness = 300, damping = 30) => ({
    type: "spring",
    stiffness,
    damping
});

export default animations;