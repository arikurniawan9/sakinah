// components/ui/Select.js
import { cn } from '../../lib/utils';

// Simple select component using native HTML select
const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
      {...props}
    >
      {children}
    </select>
  );
};

const SelectTrigger = ({ children, ...props }) => {
  // For native select, we don't need a separate trigger
  // This component is kept for compatibility with shadcn-style interface
  return null;
};

const SelectContent = ({ children, ...props }) => {
  // For native select, options are direct children of select
  // This component is kept for compatibility with shadcn-style interface
  return <>{children}</>;
};

const SelectItem = ({ children, value, ...props }) => {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
};

const SelectValue = ({ placeholder }) => {
  // For native select, we don't need a separate value display
  // This component is kept for compatibility with shadcn-style interface
  return null;
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };