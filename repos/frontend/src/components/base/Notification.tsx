"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  PiX,
  PiInfo,
  PiCheckCircle,
  PiWarningCircle,
  PiXCircle,
} from "react-icons/pi";
import { motion, AnimatePresence } from "motion/react";
import {
  useNotificationState,
  Notification as NotificationType,
} from "@/hooks/stores/useNotificationState";

const icons = {
  info: <PiInfo size={24} className="text-ctp-lavender" />,
  success: <PiCheckCircle size={24} className="text-ctp-green" />,
  warning: <PiWarningCircle size={24} className="text-ctp-yellow" />,
  error: <PiXCircle size={24} className="text-ctp-red" />,
};

const progressColors = {
  info: "bg-ctp-lavender",
  success: "bg-ctp-green",
  warning: "bg-ctp-yellow",
  error: "bg-ctp-red",
};

interface INotificationItemProps {
  notification: NotificationType;
}

export function NotificationItem({ notification }: INotificationItemProps) {
  const removeNotification = useNotificationState(
    (state) => state.removeNotification,
  );

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, removeNotification]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15, ease: "easeIn" },
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative w-80 bg-ctp-surface0 p-4 rounded-xl shadow-2xl border border-white/10 flex items-start gap-4 pointer-events-auto overflow-hidden"
    >
      <div className="shrink-0">{icons[notification.type]}</div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <span className="text-ctp-text font-medium text-[16px] leading-tight">
            {notification.title}
          </span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 p-1 -mt-1 -mr-1 rounded-full hover:bg-white/10 text-ctp-lavender transition-colors cursor-pointer"
          >
            <PiX size={20} />
          </button>
        </div>

        {notification.message && (
          <p className="text-ctp-subtext0 text-sm leading-relaxed wrap-break-word">
            {notification.message}
          </p>
        )}
      </div>

      {notification.duration && notification.duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{
            duration: notification.duration / 1000,
            ease: "linear",
          }}
          className={`absolute bottom-0 left-0 h-[3px] ${progressColors[notification.type]}`}
        />
      )}
    </motion.div>
  );
}

export function NotificationContainer() {
  const notifications = useNotificationState((state) => state.notifications);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
