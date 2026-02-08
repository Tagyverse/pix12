import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';

export default function PurchaseNotification() {
  const { data: publishedData } = usePublishedData();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!publishedData?.settings) return;

    try {
      const settingsArray = Object.values(publishedData.settings);
      if (settingsArray.length > 0) {
        const settings: any = settingsArray[0];
        
        if (settings.purchase_notifications_enabled && settings.purchase_notifications) {
          setNotifications(settings.purchase_notifications);
        }
      }
    } catch (error) {
      console.error('Error loading purchase notifications:', error);
    }
  }, [publishedData]);

  useEffect(() => {
    if (notifications.length === 0) return;

    const showNotification = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % notifications.length);
          setTimeout(showNotification, 15000);
        }, 500);
      }, 5000);
    };

    const initialTimeout = setTimeout(showNotification, 3000);

    return () => clearTimeout(initialTimeout);
  }, [notifications]);

  if (notifications.length === 0 || !isVisible) {
    return null;
  }

  const notification = notifications[currentIndex];

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 bg-white rounded-2xl shadow-2xl p-4 max-w-sm border-2 border-teal-200 transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3">
        {notification.image_url && (
          <img
            src={notification.image_url}
            alt={notification.product_name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-600">RECENT PURCHASE</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{notification.customer_name}</p>
          <p className="text-xs text-gray-600">purchased {notification.product_name}</p>
          <p className="text-xs text-gray-500 mt-1">{notification.location} • {notification.time_ago}</p>
        </div>
      </div>
    </div>
  );
}
