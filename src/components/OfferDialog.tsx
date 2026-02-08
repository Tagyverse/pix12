import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
}

export default function OfferDialog() {
  const { data: publishedData } = usePublishedData();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [popupEnabled, setPopupEnabled] = useState(true);

  useEffect(() => {
    if (!publishedData) return;

    try {
      let isPopupEnabled = true;
      if (publishedData.site_settings) {
        const settingsArray = Object.values(publishedData.site_settings);
        if (settingsArray.length > 0) {
          const settings: any = settingsArray[0];
          isPopupEnabled = settings.popup_enabled !== false;
          setPopupEnabled(isPopupEnabled);
        }
      }

      if (!isPopupEnabled) {
        return;
      }

      if (publishedData.offers) {
        let activeOffer: Offer | null = null;
        Object.entries(publishedData.offers).forEach(([key, data]: [string, any]) => {
          if (data.is_active) {
            activeOffer = { id: key, ...data };
          }
        });

        if (activeOffer && !hasBeenShown) {
          setOffer(activeOffer);
          setTimeout(() => {
            setIsVisible(true);
            setHasBeenShown(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error loading offer:', error);
    }
  }, [publishedData, hasBeenShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !offer || !popupEnabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleIn">
        {offer.image_url && (
          <div className="relative h-48">
            <img
              src={offer.image_url}
              alt={offer.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              SPECIAL OFFER
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">{offer.title}</h2>
          <p className="text-gray-600 mb-6">{offer.description}</p>

          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-teal-500 to-mint-500 hover:from-teal-600 hover:to-mint-600 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
