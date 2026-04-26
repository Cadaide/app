import {
  useState,
  useRef,
  useEffect,
  HTMLAttributes,
  useCallback,
} from "react";
import { Icon } from "@iconify/react";

export type SelectOption = {
  id: string;
  label: string;
  icon?: string;
};

export type SelectDivider = {
  isDivider: true;
  label?: string;
};

export type SelectItem = SelectOption | SelectDivider;

interface ISelectProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  options: SelectItem[];
  placeholder?: string;
  defaultValue?: string;
  label?: string;
  onValueChange?: (value: string) => void;
}

export function Select(props: ISelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(props.defaultValue ?? "");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = props.options.find(
    (opt) => !("isDivider" in opt) && opt.id === value,
  ) as SelectOption | undefined;

  const handleSelect = useCallback((id: string) => {
    setValue(id);
    props.onValueChange?.(id);

    setIsOpen(false);
  }, []);

  const {
    name,
    options,
    placeholder,
    defaultValue,
    className,
    label,
    onValueChange,
    ...restProps
  } = props;

  return (
    <div
      ref={dropdownRef}
      {...restProps}
      className={`relative w-full ${props.className || ""}`}
    >
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-1">
          {label}
        </label>
      )}
      {props.name && <input type="hidden" name={props.name} value={value} />}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 flex items-center justify-between rounded-md border border-white/10 bg-ctp-surface0 text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-lavender transition-colors duration-300 ${isOpen ? "ring-2 ring-ctp-lavender" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption?.icon && (
            <Icon icon={selectedOption.icon} className="text-lg shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? (
              selectedOption.label
            ) : (
              <span className="opacity-50">
                {props.placeholder || "Select an option..."}
              </span>
            )}
          </span>
        </div>
        <Icon
          icon="mdi:chevron-down"
          className={`text-xl transition-transform duration-300 text-white/50 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-1 rounded-md border border-white/10 bg-ctp-surface0/95 backdrop-blur-md shadow-lg max-h-60 overflow-auto">
          {props.options.map((item, index) => {
            if ("isDivider" in item)
              return (
                <div key={`divider-${index}`} className="px-3 py-2">
                  {item.label && (
                    <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                  )}
                  <div className="h-px bg-white/10" />
                </div>
              );

            const option = item as SelectOption;
            const isSelected = option.id === value;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full px-4 py-2 flex items-center gap-2 text-left transition-colors duration-200 hover:bg-white/5 ${
                  isSelected ? "text-ctp-lavender bg-white/5" : "text-ctp-text"
                }`}
              >
                {option.icon && (
                  <Icon icon={option.icon} className="text-lg shrink-0" />
                )}
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Icon icon="mdi:check" className="ml-auto text-lg shrink-0" />
                )}
              </button>
            );
          })}
          {props.options.length === 0 && (
            <div className="px-4 py-2 text-white/50 text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
