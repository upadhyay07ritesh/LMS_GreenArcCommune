export default function Input({ 
  label, 
  error, 
  floating = false,
  className = '',
  id,
  ...props 
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  if (floating) {
    return (
      <div className="relative">
        <input
          id={inputId}
          className={`peer input-floating ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          placeholder={label}
          {...props}
        />
        <label 
          htmlFor={inputId} 
          className="absolute left-4 top-2 text-xs font-medium text-slate-500 dark:text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-500"
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}