interface IInputProps {
  name: string;
  placeholder?: string;
}

export function Input(props: IInputProps) {
  return (
    <input
      type="text"
      name={props.name}
      placeholder={props.placeholder}
      className={`w-full px-4 py-2 rounded-md border border-white/10 bg-ctp-surface0 text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-lavender transition-colors duration-300`}
    />
  );
}
