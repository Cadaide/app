import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { PiX } from "react-icons/pi";
import { motion, AnimatePresence } from "motion/react";

interface IDialogPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode | ReactNode[];
}

interface IDialogHeaderProps {
  title: string;
  onClose: () => void;
}

export function DialogPortal(props: IDialogPortalProps) {
  return createPortal(
    <AnimatePresence>
      {props.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
            style={{
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitBackdropFilter: "blur(12px)",
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="relative bg-ctp-surface0 p-4 rounded-xl min-w-[33%] shadow-2xl border border-white/10"
          >
            {props.children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function DialogHeader(props: IDialogHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between mb-4">
      <span className="text-ctp-text font-medium text-[16px] whitespace-nowrap grow text-left">
        {props.title}
      </span>
      <button
        onClick={props.onClose}
        className="p-1 rounded-full hover:bg-white/10 text-ctp-lavender transition-colors cursor-pointer"
      >
        <PiX size={20} />
      </button>
    </div>
  );
}
