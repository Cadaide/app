import { PiCircleNotch } from "react-icons/pi";

interface ILoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "text-ctp-lavender" }: ILoadingSpinnerProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <PiCircleNotch
      className={`${sizeClasses[size]} ${className} animate-spin`}
    />
  );
}
