import React from 'react';

interface TabsProps<T extends string = string> {
  defaultValue?: T;
  value?: T;
  onValueChange?: (value: T) => void;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export const Tabs = <T extends string>({ 
  defaultValue,
  value,
  onValueChange,
  children 
}: TabsProps<T>) => {
  const [selectedTab, setSelectedTab] = React.useState<T | undefined>(defaultValue || value);

  React.useEffect(() => {
    if (value !== undefined && value !== selectedTab) {
      setSelectedTab(value);
    }
  }, [value, selectedTab]);

  const handleValueChange = (newValue: T) => {
    if (value === undefined) {
      setSelectedTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <div data-value={selectedTab}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue: selectedTab,
            onValueChange: handleValueChange
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = <T extends string>({ children }: TabsListProps) => {
  return (
    <div className="flex space-x-2 border-b border-gray-200">
      {children}
    </div>
  );
};

export const TabsTrigger = <T extends string>({ 
  value, 
  children,
  selectedValue,
  onValueChange
}: TabsTriggerProps & { value: T, selectedValue?: T; onValueChange?: (value: T) => void }) => {
  const isSelected = selectedValue === value;

  return (
    <button
      className={`px-4 py-2 text-sm font-medium transition-colors duration-200 
        ${isSelected 
          ? 'text-blue-500 border-b-2 border-blue-500' 
          : 'text-gray-500 hover:text-gray-700'}`}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = <T extends string>({
  value,
  children,
  selectedValue
}: TabsContentProps & { value: T, selectedValue?: T }) => {
  if (selectedValue !== value) return null;

  return <div className="py-4">{children}</div>;
};