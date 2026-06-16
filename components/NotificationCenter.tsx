'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, ShieldAlert, Trophy, CreditCard, CalendarCheck, Zap, Star, Flame, AlertCircle } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../app/actions/notifications';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // Map to correct Date object
      const formatted = data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
      setNotifications(formatted);
      setUnreadCount(formatted.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 100);
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true);
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    const iconClass = "w-4 h-4 stroke-[2.5px] text-black";
    switch (type) {
      case 'BUDGET_ALERT':
        return <div className="p-1.5 bg-[#fecaca] border-[1.5px] border-black"><ShieldAlert className={iconClass} /></div>;
      case 'GOAL_REACHED':
        return <div className="p-1.5 bg-[#fef08a] border-[1.5px] border-black"><Trophy className={iconClass} /></div>;
      case 'PAYLATER_DUE':
      case 'DEBT_DUE':
        return <div className="p-1.5 bg-[#fed7aa] border-[1.5px] border-black"><CreditCard className={iconClass} /></div>;
      case 'SUBSCRIPTION_DUE':
        return <div className="p-1.5 bg-[#dbeafe] border-[1.5px] border-black"><CalendarCheck className={iconClass} /></div>;
      case 'TRIAL_WARNING':
        return <div className="p-1.5 bg-[#f5d0fe] border-[1.5px] border-black"><Zap className={iconClass} /></div>;
      case 'PAYMENT_APPROVED':
        return <div className="p-1.5 bg-[#bbf7d0] border-[1.5px] border-black"><Check className={iconClass} /></div>;
      case 'PAYMENT_REJECTED':
        return <div className="p-1.5 bg-[#fca5a5] border-[1.5px] border-black"><X className={iconClass} /></div>;
      case 'ACHIEVEMENT':
        return <div className="p-1.5 bg-[#e9d5ff] border-[1.5px] border-black"><Star className={iconClass} /></div>;
      case 'STREAK':
        return <div className="p-1.5 bg-[#fed7aa] border-[1.5px] border-black"><Flame className={iconClass} /></div>;
      default:
        return <div className="p-1.5 bg-[#e5e7eb] border-[1.5px] border-black"><AlertCircle className={iconClass} /></div>;
    }
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          fetchNotifications();
        }}
        className="relative border-[2.5px] border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer rounded-none flex items-center justify-center"
      >
        <Bell className="w-5 h-5 text-black stroke-[2.5px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2.5 bg-[#ff6b6b] text-white text-[9px] font-black border-[2px] border-black px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Sidebar Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-[#FAF9F5] border-l-[4px] border-black shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out translate-x-0">
              
              {/* Header */}
              <div className="p-5 border-b-[3px] border-black bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black uppercase tracking-wider text-black">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#FFE066] text-black text-[10px] font-black border-[1.5px] border-black px-2 py-0.5">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 border-[2px] border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-black stroke-[2.5px]" />
                </button>
              </div>

              {/* Actions toolbar */}
              {notifications.length > 0 && (
                <div className="px-5 py-2.5 border-b-[2px] border-black bg-white/70 flex justify-between gap-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading || unreadCount === 0}
                    className="flex-1 py-1.5 border-[2.5px] border-black bg-[#bbf7d0] hover:bg-[#a6ecbd] text-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Tandai Semua Dibaca
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={loading}
                    className="py-1.5 px-3 border-[2.5px] border-black bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              )}

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 border-[3px] border-black bg-white flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Bell className="w-8 h-8 text-neutral-300 stroke-[2px]" />
                    </div>
                    <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada notifikasi</p>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Semua kabar keuangan Anda terpantau aman!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`relative border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex gap-3 ${
                        notif.isRead 
                          ? 'bg-white text-neutral-800' 
                          : 'bg-[#faf5d9] border-[#000] text-black font-semibold'
                      }`}
                    >
                      {/* Left icon wrapper */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0 pr-6">
                        <p className={`text-xs font-black uppercase tracking-wider ${notif.isRead ? 'text-neutral-900' : 'text-black'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-neutral-600 font-bold uppercase tracking-wide mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-2">
                          {notif.createdAt.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Mark as read tick action button */}
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="absolute top-3 right-3 p-1 border-[1.5px] border-black bg-white hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
                          title="Tandai sudah dibaca"
                        >
                          <Check className="w-3.5 h-3.5 text-black stroke-[3px]" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
