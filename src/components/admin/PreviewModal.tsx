import { X, Eye, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Create a preview URL with a special query parameter
      const currentOrigin = window.location.origin;
      const previewParam = `preview=true&timestamp=${Date.now()}`;
      setPreviewUrl(`${currentOrigin}/?${previewParam}`);
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Preview Changes</h2>
              <p className="text-purple-100 text-sm">See how your unpublished changes will look</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Notice */}
        <div className="bg-yellow-50 border-b-2 border-yellow-200 px-6 py-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <Eye className="w-4 h-4" />
            <p className="text-sm font-medium">
              Preview Mode: Viewing UNPUBLISHED changes from Firebase. Click "Publish to Live" to make these visible to users.
            </p>
          </div>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading preview...</p>
              </div>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Note:</span> Preview shows published R2 data. Make changes in admin, then publish to see them here.
          </p>
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
