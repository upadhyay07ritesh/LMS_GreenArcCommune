export default function Badge({ 
  children, 
  variant = 'primary', 
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
  };
  
  const variantClass = variants[variant] || variants.primary;
  
  return (
    <span className={`badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}