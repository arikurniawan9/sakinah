// components/ui/Badge.js
import { cn } from '../../lib/utils';

const Badge = ({ className, variant = "default", ...props }) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };