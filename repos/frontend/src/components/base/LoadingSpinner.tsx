import { PiCircleNotch } from "react-icons/pi";

interface ILoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ size = "md" }: ILoadingSpinnerProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <PiCircleNotch
      className={`${sizeClasses[size]} text-ctp-lavender animate-spin`}
    />
  );
}
