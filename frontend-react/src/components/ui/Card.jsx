import { motion } from 'framer-motion';

const Card = ({
    children,
    variant = 'default',
    padding = 'md',
    shadow = 'soft',
    hover = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'bg-white rounded-2xl border border-neutral-200 transition-all duration-200';

    const variants = {
        default: 'bg-white',
        gradient: 'bg-gradient-to-br from-white to-neutral-50',
        glass: 'bg-white/80 backdrop-blur-sm border-white/20',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
    };

    const shadows = {
        none: '',
        soft: 'shadow-soft',
        medium: 'shadow-medium',
        hard: 'shadow-hard',
    };

    const hoverClasses = hover
        ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
        : '';

    const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${paddings[padding]}
    ${shadows[shadow]}
    ${hoverClasses}
    ${className}
  `.trim();

    const CardComponent = hover ? motion.div : 'div';
    const motionProps = hover ? {
        whileHover: { y: -4, scale: 1.02 },
        transition: { type: "spring", stiffness: 300, damping: 20 }
    } : {};

    return (
        <CardComponent
            className={classes}
            {...motionProps}
            {...props}
        >
            {children}
        </CardComponent>
    );
};

const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-6 ${className}`}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-xl font-semibold text-neutral-900 ${className}`}>
        {children}
    </h3>
);

const CardDescription = ({ children, className = '' }) => (
    <p className={`text-neutral-600 mt-2 ${className}`}>
        {children}
    </p>
);

const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-6 pt-6 border-t border-neutral-200 ${className}`}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;