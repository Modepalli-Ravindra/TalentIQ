import React from 'react';
import { X, Bell, BellOff, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification, NotificationType } from '../../types';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<NotificationType, string> = {
  application_update: '📋',
  job_match: '🎯',
  interview_scheduled: '📅',
  message: '💬',
  system: '🔔',
  offer: '🎉',
};

const typeLabels: Record<NotificationType, string> = {
  application_update: 'Application Update',
  job_match: 'Job Match',
  interview_scheduled: 'Interview Scheduled',
  message: 'Message',
  system: 'System',
  offer: 'Offer',
};

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const icon = typeIcons[notification.type as NotificationType] || '🔔';
  const label = typeLabels[notification.type as NotificationType] || 'Notification';
  const payload = notification.payload as Record<string, string>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => !notification.read && onRead(notification.id)}
      className={`p-4 border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-400">{label}</span>
            {!notification.read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-zinc-200 leading-snug">
            {payload?.message || payload?.title || JSON.stringify(payload)}
          </p>
          {payload?.job_title && (
            <p className="text-xs text-zinc-500 mt-1">{payload.job_title}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            {new Date(notification.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#111113] border-l border-zinc-800 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BellOff className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">No notifications yet</p>
                  <p className="text-zinc-600 text-xs mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markRead}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
