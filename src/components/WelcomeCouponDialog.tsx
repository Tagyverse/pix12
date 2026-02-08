import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';

export default function WelcomeCouponDialog() {
  const { data: publishedData } = usePublishedData();
  const [isVisible, setIsVisible] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (!publishedData?.settings || hasBeenShown) return;

    try {
      const settingsArray = Object.values(publishedData.settings);
      if (settingsArray.length > 0) {
        const settings: any = settingsArray[0];
        
        if (settings.welcome_coupon_enabled && settings.welcome_coupon_code) {
          setCouponCode(settings.welcome_coupon_code);
          setTimeout(() => {
            setIsVisible(true);
            setHasBeenShown(true);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error loading welcome coupon:', error);
    }
  }, [publishedData, hasBeenShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    alert('Coupon code copied!');
    handleClose();
  };

  if (!isVisible || !couponCode) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleIn">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Gift!</h2>
          <p className="text-purple-100">Here's a special coupon just for you</p>
        </div>

        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors shadow-lg z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-dashed border-purple-300">
            <p className="text-sm text-gray-600 mb-2 text-center">Your Coupon Code</p>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600 tracking-wider">{couponCode}</p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Copy Code & Start Shopping
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This coupon can be applied at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
