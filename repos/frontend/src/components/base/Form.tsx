import { ReactNode } from "react";

interface IFormProps {
  children: ReactNode | ReactNode[];
  onSubmit: (data: FormData) => void;
}

export function Form(props: IFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        props.onSubmit(new FormData(e.currentTarget));
      }}
    >
      {props.children}
    </form>
  );
}
