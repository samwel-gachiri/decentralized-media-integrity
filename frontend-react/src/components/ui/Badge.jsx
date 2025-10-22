import { motion } from 'framer-motion';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    iconPosition = 'left',
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';

    const variants = {
        default: 'bg-neutral-100 text-neutral-800',
        primary: 'bg-primary-100 text-primary-800',
        secondary: 'bg-secondary-100 text-secondary-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        error: 'bg-error-100 text-error-800',
        outline: 'border-2 border-neutral-300 text-neutral-700 bg-white',
        solid: 'bg-neutral-800 text-white',
        gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim();

    const iconClass = iconSizes[size];

    return (
        <motion.span
            className={classes}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            {...props}
        >
            {icon && iconPosition === 'left' && (
                <span className={`${iconClass} ${children ? 'mr-1.5' : ''}`}>
                    {typeof icon === 'function' ? icon({ className: iconClass }) : icon}
                </span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
                <span className={`${iconClass} ${children ? 'ml-1.5' : ''}`}>
                    {typeof icon === 'function' ? icon({ className: iconClass }) : icon}
                </span>
            )}
        </motion.span>
    );
};

export default Badge;