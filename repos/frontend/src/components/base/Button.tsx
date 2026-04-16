import { MouseEvent, ReactNode } from "react";

interface IButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode | ReactNode[];
  variant: "primary" | "secondary" | "danger";
  type?: "button" | "submit" | "reset";
}

export function Button(props: IButtonProps) {
  const variantClasses = {
    primary: "bg-ctp-lavender-700 text-ctp-mantle hover:bg-ctp-lavender-700/70",
    secondary: "bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface0/70",
    danger: "bg-ctp-red-700 text-ctp-mantle hover:bg-ctp-red-700/70",
  };

  return (
    <button
      onClick={props.onClick}
      type={props.type ?? "button"}
      className={`${variantClasses[props.variant]} px-4 py-2 rounded-md cursor-pointer transition-colors duration-300`}
    >
      {props.children}
    </button>
  );
}
