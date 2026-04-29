import { MouseEvent, ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface IButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode | ReactNode[];
  variant: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  disabled?: boolean;
}

export function Button(props: IButtonProps) {
  const variantClasses = {
    primary: "bg-ctp-lavender-700 text-ctp-mantle hover:bg-ctp-lavender-700/70 disabled:bg-ctp-lavender-700/50",
    secondary: "bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface0/70 disabled:bg-ctp-surface0/50",
    danger: "bg-ctp-red-700 text-ctp-mantle hover:bg-ctp-red-700/70 disabled:bg-ctp-red-700/50",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const spinnerColorClasses = {
    primary: "text-ctp-mantle",
    secondary: "text-ctp-text",
    danger: "text-ctp-mantle",
  };

  const size = props.size ?? "md";

  return (
    <button
      onClick={props.onClick}
      type={props.type ?? "button"}
      disabled={props.isLoading || props.disabled}
      className={`${variantClasses[props.variant]} ${sizeClasses[size]} flex items-center justify-center gap-2 rounded-md cursor-pointer disabled:cursor-not-allowed transition-colors duration-300`}
    >
      {props.isLoading ? (
        <LoadingSpinner size={size === "lg" ? "md" : "sm"} className={spinnerColorClasses[props.variant]} />
      ) : (
        props.iconLeft
      )}
      {props.children}
      {props.iconRight}
    </button>
  );
}
