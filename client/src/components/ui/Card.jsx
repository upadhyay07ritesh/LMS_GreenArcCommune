import { motion } from 'framer-motion';

export default function Card({ 
  children, 
  variant = 'default', 
  hover = false,
  className = '',
  ...props 
}) {
  const variants = {
    default: 'card',
    glass: 'card-glass',
    neumorphic: 'card-neumorphic',
  };
  
  const variantClass = variants[variant] || variants.default;
  const hoverClass = hover ? 'card-hover' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${variantClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}