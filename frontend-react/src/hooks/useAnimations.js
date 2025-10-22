import { useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Hook for managing complex animations
export const useAnimations = () => {
    const controls = useAnimation();

    const startAnimation = async (animation) => {
        await controls.start(animation);
    };

    const stopAnimation = () => {
        controls.stop();
    };

    const setAnimation = (animation) => {
        controls.set(animation);
    };

    return {
        controls,
        startAnimation,
        stopAnimation,
        setAnimation
    };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1, triggerOnce = true) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(entry.target);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold, triggerOnce]);

    return [ref, isVisible];
};

// Hook for hover animations
export const useHoverAnimation = (hoverAnimation, restAnimation) => {
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimation();

    useEffect(() => {
        if (isHovered) {
            controls.start(hoverAnimation);
        } else {
            controls.start(restAnimation);
        }
    }, [isHovered, hoverAnimation, restAnimation, controls]);

    const hoverProps = {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false)
    };

    return { controls, hoverProps, isHovered };
};

// Hook for stagger animations
export const useStaggerAnimation = (items, staggerDelay = 0.1) => {
    const controls = useAnimation();

    const startStagger = async () => {
        await controls.start(i => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * staggerDelay }
        }));
    };

    const resetStagger = () => {
        controls.set({ opacity: 0, y: 20 });
    };

    return { controls, startStagger, resetStagger };
};

// Hook for loading animations
export const useLoadingAnimation = (isLoading) => {
    const controls = useAnimation();

    useEffect(() => {
        if (isLoading) {
            controls.start({
                rotate: 360,
                transition: { duration: 1, repeat: Infinity, ease: "linear" }
            });
        } else {
            controls.stop();
            controls.set({ rotate: 0 });
        }
    }, [isLoading, controls]);

    return controls;
};

// Hook for typing animation
export const useTypingAnimation = (text, speed = 50) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!text) return;

        setIsTyping(true);
        setDisplayText('');

        let index = 0;
        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayText(prev => prev + text[index]);
                index++;
            } else {
                setIsTyping(false);
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayText, isTyping };
};

// Hook for progress animation
export const useProgressAnimation = (progress, duration = 1000) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startProgress = animatedProgress;
        const progressDiff = progress - startProgress;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const ratio = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easedRatio = 1 - Math.pow(1 - ratio, 3);

            setAnimatedProgress(startProgress + progressDiff * easedRatio);

            if (ratio < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [progress, duration, animatedProgress]);

    return animatedProgress;
};

// Hook for mouse tracking
export const useMouseTracking = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const ref = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        };

        const element = ref.current;
        if (element) {
            element.addEventListener('mousemove', handleMouseMove);
            return () => element.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    return [ref, mousePosition];
};

// Hook for parallax effect
export const useParallax = (speed = 0.5) => {
    const [offset, setOffset] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const scrolled = window.pageYOffset;
                const rate = scrolled * speed;
                setOffset(rate);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return [ref, offset];
};

// Hook for countdown animation
export const useCountdown = (targetDate) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
};

// Hook for number animation
export const useNumberAnimation = (targetNumber, duration = 1000) => {
    const [currentNumber, setCurrentNumber] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startNumber = currentNumber;
        const numberDiff = targetNumber - startNumber;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const ratio = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easedRatio = 1 - Math.pow(1 - ratio, 3);

            setCurrentNumber(Math.round(startNumber + numberDiff * easedRatio));

            if (ratio < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [targetNumber, duration, currentNumber]);

    return currentNumber;
};

export default {
    useAnimations,
    useScrollAnimation,
    useHoverAnimation,
    useStaggerAnimation,
    useLoadingAnimation,
    useTypingAnimation,
    useProgressAnimation,
    useMouseTracking,
    useParallax,
    useCountdown,
    useNumberAnimation
};