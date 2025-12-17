import React, { useState, useEffect, useRef } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
    value, 
    onChange, 
    className = "", 
    placeholder, 
    multiline = false, 
    rows = 1,
    disabled = false
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (multiline && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [internalValue, multiline]);

  const handleBlur = () => {
    if (!disabled) {
        onChange(internalValue);
    }
  };

  const commonClasses = `bg-transparent hover:bg-yellow-50 focus:bg-yellow-100 transition-colors border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none print:border-none print:bg-transparent min-w-0 ${disabled ? 'hover:bg-transparent cursor-default border-none' : ''} ${className}`;

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={internalValue}
        onChange={(e) => !disabled && setInternalValue(e.target.value)}
        onBlur={handleBlur}
        className={`${commonClasses} w-full resize-none overflow-hidden block`}
        placeholder={placeholder}
        rows={rows}
        readOnly={disabled}
      />
    );
  }

  return (
    <input
      type="text"
      value={internalValue}
      onChange={(e) => !disabled && setInternalValue(e.target.value)}
      onBlur={handleBlur}
      className={commonClasses}
      placeholder={placeholder}
      readOnly={disabled}
    />
  );
};

export default EditableField;