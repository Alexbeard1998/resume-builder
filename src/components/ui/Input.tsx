import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

// Базовые стили для инпутов
const baseInputStyles =
  "w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    return (
      <div className="space-y-1">
        {label && (
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`${baseInputStyles} ${error ? "border-red-500" : "border-gray-300"} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="space-y-1">
        {label && (
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor={textareaId}
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`${baseInputStyles} ${error ? "border-red-500" : "border-gray-300"} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
