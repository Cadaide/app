import { PiCards, PiCornersOut, PiMinus, PiX } from "react-icons/pi";

export function Menubar() {
  return (
    <div className="w-full h-10 bg-ctp-mantle text-ctp-text text-sm border-b border-ctp-surface0 flex flex-row items-center gap-1.5 px-3.5">
      <p className="w-full">Cadaide</p>
      <WindowButtons />
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="flex flex-row gap-1">
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
        <PiMinus className="text-lg" />
      </div>
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
        <PiCards className="text-lg" />
      </div>
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
        <PiX className="text-lg" />
      </div>
    </div>
  );
}
