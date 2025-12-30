"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = "", label, description, id, ...props }, ref) => {
    const toggleId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label
        htmlFor={toggleId}
        className={`
          flex items-center justify-between gap-4 cursor-pointer
          ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        <div className="flex-1">
          {label && (
            <span className="block text-base font-medium text-foreground">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-sm text-foreground-muted mt-0.5">
              {description}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            className="peer sr-only"
            {...props}
          />
          <div
            className="
              w-12 h-7 rounded-full
              bg-input border border-border
              peer-checked:bg-primary peer-checked:border-primary
              transition-colors duration-200
            "
          />
          <div
            className="
              absolute top-0.5 left-0.5
              w-6 h-6 rounded-full
              bg-white shadow-sm
              peer-checked:translate-x-5
              transition-transform duration-200
            "
          />
        </div>
      </label>
    );
  }
);

Toggle.displayName = "Toggle";
