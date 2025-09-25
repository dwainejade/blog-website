const Tag = ({
  children,
  size = 'medium',
  onClick,
  className = '',
  clickable = false
}) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-1.5 text-base',
    large: 'px-4 py-2 text-xl'
  };

  const baseClasses = 'bg-grey rounded-full capitalize transition-colors duration-200 inline-block';
  const hoverClasses = clickable || onClick
    ? 'hover:bg-purple hover:text-white cursor-pointer'
    : '';

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${hoverClasses} ${className}`.trim();

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <span
      className={combinedClasses}
      onClick={handleClick}
    >
      {children}
    </span>
  );
};

export default Tag;