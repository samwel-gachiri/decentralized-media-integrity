import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = forwardRef(({
    label,
    type = 'text',
    placeholder,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    showPasswordToggle = false,
    required = false,
    disabled = false,
    fullWidth = true,
    className = '',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const baseClasses = 'block w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = error
        ? 'border-error-300 bg-error-50 focus:border-error-500 focus:ring-error-500'
        : isFocused
            ? 'border-primary-500 bg-white focus:border-primary-500 focus:ring-primary-500'
            : 'border-neutral-300 bg-white hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500';

    const iconClasses = 'absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400';

    const inputClasses = `
    ${baseClasses}
    ${stateClasses}
    ${icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${icon && iconPosition === 'right' ? 'pr-10' : ''}
    ${showPasswordToggle ? 'pr-10' : ''}
    ${!fullWidth ? 'w-auto' : ''}
    ${className}
  `.trim();

    return (
        <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
            {label && (
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {label}
                    {required && <span className="text-error-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {typeof icon === 'function' ? icon({ className: 'w-5 h-5 text-neutral-400' }) : icon}
                    </div>
                )}

                <input
                    ref={ref}
                    type={inputType}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClasses}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {icon && iconPosition === 'right' && !showPasswordToggle && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {typeof icon === 'function' ? icon({ className: 'w-5 h-5 text-neutral-400' }) : icon}
                    </div>
                )}

                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {(error || helperText) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-start space-x-1"
                >
                    {error && <AlertCircle className="w-4 h-4 text-error-500 mt-0.5 flex-shrink-0" />}
                    <p className={`text-sm ${error ? 'text-error-600' : 'text-neutral-500'}`}>
                        {error || helperText}
                    </p>
                </motion.div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;