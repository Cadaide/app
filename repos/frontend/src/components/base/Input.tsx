import { InputHTMLAttributes } from "react";

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  name?: string;
  placeholder?: string;
  label?: string;
}

export function Input(props: IInputProps) {
  const { label, className, ...restProps } = props;

  const inputElement = (
    <input
      type="text"
      {...restProps}
      className={`w-full px-4 py-2 rounded-md border border-white/10 bg-ctp-surface0 text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-lavender transition-colors duration-300 ${className || ""}`}
    />
  );

  if (label)
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-white/70 mb-1">
          {label}
        </label>
        {inputElement}
      </div>
    );

  return inputElement;
}
