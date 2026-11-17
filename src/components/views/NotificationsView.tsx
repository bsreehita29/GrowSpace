import { useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, Info, Trash2 } from 'lucide-react';
import {
  createNotification,
  deleteSubdoc,
  markNotificationRead,
} from '../../services/firestoreService';
import type { SmartAlert } from '../../hooks/useGrowSpaceData';
import type { AppNotification, ModuleId } from '../../types/growth';

interface NotificationsViewProps {
  uid: string;
  notifications: AppNotification[];
  smartAlerts: SmartAlert[];
  onNavigate: (module: ModuleId) => void;
}

export function NotificationsView({
  uid,
  notifications,
  smartAlerts,
  onNavigate,
}: NotificationsViewProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [module, setModule] = useState('daily_life');

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    await createNotification(uid, {
      title,
      message,
      module,
      read: false,
    });
    setTitle('');
    setMessage('');
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(uid, n.id, true)));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        {/* Live Smart Alerts */}
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#1F2A22]">Live Workspace Insights</h3>
            <p className="text-xs text-[#5A685C]">
              Automatically computed from your attendance, hydration, reminders, and monthly budget
            </p>
          </div>
          {smartAlerts.length === 0 ? (
            <p className="text-xs text-[#5A685C] py-3">
              All targets are currently on track with no active warnings.
            </p>
          ) : (
            <div className="space-y-2.5">
              {smartAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border flex items-start justify-between gap-3 ${
                    alert.severity === 'warning'
                      ? 'bg-[#FDF5F3] border-[#E8C5BF]'
                      : 'bg-[#EEF3EC] border-[#D4E2D2]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {alert.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-[#B44C44] mt-0.5 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-[#3E6B4F] mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-[#1F2A22]">{alert.title}</p>
                      <p className="text-xs text-[#5A685C] mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(alert.module)}
                    className="text-xs font-medium text-[#3E6B4F] hover:underline shrink-0 cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Notifications */}
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Notification Feed</h3>
            </div>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3E6B4F] hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-[#859286] py-6 text-center">No notifications saved.</p>
          ) : (
            <div className="divide-y divide-[#EEF1EA]">
              {notifications.map((notif) => (
                <div key={notif.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className={`text-sm ${notif.read ? 'text-[#5A685C]' : 'font-semibold text-[#1F2A22]'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-[#5A685C]">{notif.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => markNotificationRead(uid, notif.id, !notif.read)}
                      className="text-xs text-[#3E6B4F] hover:underline cursor-pointer"
                    >
                      {notif.read ? 'Unread' : 'Mark read'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'notifications', notif.id)}
                      aria-label="Delete notification"
                      className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Custom Reminder Notification */}
      <form
        onSubmit={handleCreateReminder}
        className="lg:col-span-5 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
      >
        <h3 className="text-base font-semibold text-[#1F2A22]">Pin a Personal Reminder</h3>
        <input
          type="text"
          required
          placeholder="Reminder headline"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
        />
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
        >
          <option value="daily_life">Daily Life</option>
          <option value="study">Study</option>
          <option value="career">Career</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
        </select>
        <textarea
          rows={3}
          required
          placeholder="Details or action step..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
        />
        <button
          type="submit"
          className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
        >
          Create Reminder Alert
        </button>
      </form>
    </div>
  );
}
