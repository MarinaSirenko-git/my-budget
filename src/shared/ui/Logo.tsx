import { CreditCardIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

interface LogoProps {
  /** Icon size - default is 'md' (w-6 h-6) */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Text size className - default is 'text-xl' */
  textSize?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether to render as Link or div */
  asLink?: boolean;
  /** Custom text color className */
  textColor?: string;
}

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function Logo({ 
  iconSize = 'md', 
  textSize = 'text-xl',
  className = '',
  asLink = true,
  textColor = 'text-[#3B82F6] dark:text-[#3B82F6]'
}: LogoProps) {
  const iconClass = iconSizeMap[iconSize];
  const containerClass = `flex items-center font-bold gap-2 ${textSize} ${textColor} ${className}`;

  const content = (
    <>
      <CreditCardIcon className={iconClass} />
      Budgetaizer
    </>
  );

  if (asLink) {
    return (
      <Link to="/" className={containerClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClass}>
      {content}
    </div>
  );
}

