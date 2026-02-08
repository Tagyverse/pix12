import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Sparkles, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set } from 'firebase/database';

interface FooterConfig {
  is_visible: boolean;
  theme: 'modern' | 'minimal' | 'elegant' | 'bold' | 'custom';
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  linkHoverColor: string;
  accentColor: string;
  companyName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  quickLinks: Array<{ label: string; url: string }>;
  copyrightText: string;
  showQuickLinks: boolean;
  showSocial: boolean;
  showContact: boolean;
}

const presetThemes = {
  modern: {
    backgroundColor: '#1F2937',
    textColor: '#D1D5DB',
    headingColor: '#FFFFFF',
    linkColor: '#10B981',
    linkHoverColor: '#34D399',
    accentColor: '#10B981',
  },
  minimal: {
    backgroundColor: '#FFFFFF',
    textColor: '#6B7280',
    headingColor: '#111827',
    linkColor: '#4B5563',
    linkHoverColor: '#111827',
    accentColor: '#F59E0B',
  },
  elegant: {
    backgroundColor: '#111827',
    textColor: '#9CA3AF',
    headingColor: '#F9FAFB',
    linkColor: '#A78BFA',
    linkHoverColor: '#C4B5FD',
    accentColor: '#8B5CF6',
  },
  bold: {
    backgroundColor: '#DC2626',
    textColor: '#FEE2E2',
    headingColor: '#FFFFFF',
    linkColor: '#FEF3C7',
    linkHoverColor: '#FFFFFF',
    accentColor: '#FCD34D',
  },
  ocean: {
    backgroundColor: '#0369A1',
    textColor: '#BAE6FD',
    headingColor: '#FFFFFF',
    linkColor: '#7DD3FC',
    linkHoverColor: '#E0F2FE',
    accentColor: '#38BDF8',
  },
  forest: {
    backgroundColor: '#065F46',
    textColor: '#A7F3D0',
    headingColor: '#FFFFFF',
    linkColor: '#6EE7B7',
    linkHoverColor: '#D1FAE5',
    accentColor: '#34D399',
  },
  sunset: {
    backgroundColor: '#FB923C',
    textColor: '#431407',
    headingColor: '#7C2D12',
    linkColor: '#9A3412',
    linkHoverColor: '#431407',
    accentColor: '#DC2626',
  },
  midnight: {
    backgroundColor: '#1E1B4B',
    textColor: '#C4B5FD',
    headingColor: '#E0E7FF',
    linkColor: '#A78BFA',
    linkHoverColor: '#DDD6FE',
    accentColor: '#818CF8',
  },
  rose: {
    backgroundColor: '#BE123C',
    textColor: '#FECDD3',
    headingColor: '#FFFFFF',
    linkColor: '#FDA4AF',
    linkHoverColor: '#FFE4E6',
    accentColor: '#FB7185',
  },
  slate: {
    backgroundColor: '#334155',
    textColor: '#CBD5E1',
    headingColor: '#F1F5F9',
    linkColor: '#94A3B8',
    linkHoverColor: '#E2E8F0',
    accentColor: '#64748B',
  },
  emerald: {
    backgroundColor: '#047857',
    textColor: '#D1FAE5',
    headingColor: '#FFFFFF',
    linkColor: '#A7F3D0',
    linkHoverColor: '#ECFDF5',
    accentColor: '#10B981',
  },
  amber: {
    backgroundColor: '#D97706',
    textColor: '#FEF3C7',
    headingColor: '#FFFFFF',
    linkColor: '#FDE68A',
    linkHoverColor: '#FFFBEB',
    accentColor: '#F59E0B',
  },
};

function SingleColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export default function FooterManager() {
  const [config, setConfig] = useState<FooterConfig>({
    is_visible: true,
    theme: 'modern',
    backgroundColor: '#1F2937',
    textColor: '#D1D5DB',
    headingColor: '#FFFFFF',
    linkColor: '#10B981',
    linkHoverColor: '#34D399',
    accentColor: '#10B981',
    companyName: 'Pixie Blooms',
    description: 'We provide the best products and services to our customers.',
    email: 'pixieblooms2512@gmail.com',
    phone: '+1 234 567 8900',
    address: '123 Main Street, City, Country',
    social: {
      facebook: '',
      instagram: 'https://www.instagram.com/pixieblooms',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
    quickLinks: [
      { label: 'Shop', url: '/shop' },
      { label: 'Contact', url: '/contact' },
      { label: 'Privacy Policy', url: '/privacy-policy' },
      { label: 'Shipping Policy', url: '/shipping-policy' },
      { label: 'Refund Policy', url: '/refund-policy' },
    ],
    copyrightText: '© 2024 Pixie Blooms.in. All rights reserved.',
    showQuickLinks: true,
    showSocial: true,
    showContact: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    fetchFooterConfig();
  }, []);

  const fetchFooterConfig = async () => {
    try {
      const footerRef = ref(db, 'footer_config');
      const snapshot = await get(footerRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const defaultSocial = {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        };

        setConfig((prevConfig) => {
          let newQuickLinks = prevConfig.quickLinks;
          if (data.quickLinks) {
            if (Array.isArray(data.quickLinks)) {
              newQuickLinks = data.quickLinks.filter((link: any) => link && link.label && link.url);
            } else if (typeof data.quickLinks === 'object') {
              newQuickLinks = Object.values(data.quickLinks).filter((link: any) => link && link.label && link.url);
            }
          }

          const newSocial = data.social && typeof data.social === 'object' ? {
            facebook: data.social.facebook || '',
            instagram: data.social.instagram || '',
            twitter: data.social.twitter || '',
            linkedin: data.social.linkedin || '',
            youtube: data.social.youtube || '',
          } : defaultSocial;

          return {
            is_visible: data.is_visible !== undefined ? data.is_visible : prevConfig.is_visible,
            theme: data.theme || prevConfig.theme,
            backgroundColor: data.backgroundColor || prevConfig.backgroundColor,
            textColor: data.textColor || prevConfig.textColor,
            headingColor: data.headingColor || prevConfig.headingColor,
            linkColor: data.linkColor || prevConfig.linkColor,
            linkHoverColor: data.linkHoverColor || prevConfig.linkHoverColor,
            accentColor: data.accentColor || prevConfig.accentColor,
            companyName: data.companyName || prevConfig.companyName,
            description: data.description || prevConfig.description,
            email: data.email || prevConfig.email,
            phone: data.phone || prevConfig.phone,
            address: data.address || prevConfig.address,
            social: newSocial,
            quickLinks: newQuickLinks,
            copyrightText: data.copyrightText || prevConfig.copyrightText,
            showQuickLinks: data.showQuickLinks !== undefined ? data.showQuickLinks : prevConfig.showQuickLinks,
            showSocial: data.showSocial !== undefined ? data.showSocial : prevConfig.showSocial,
            showContact: data.showContact !== undefined ? data.showContact : prevConfig.showContact,
          };
        });
      }
    } catch (error: any) {
      console.error('Error fetching footer config:', error);
      setError(error?.message || 'Failed to load footer settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const footerRef = ref(db, 'footer_config');
      const dataToSave = {
        ...config,
        quickLinks: Array.isArray(config.quickLinks) ? config.quickLinks.filter(link => link && link.label && link.url) : [],
        social: config.social || {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        },
      };
      await set(footerRef, dataToSave);
      alert('Footer settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving footer config:', error);
      const errorMessage = error?.message || 'Failed to save footer settings';
      setError(errorMessage);
      alert('Failed to save footer settings: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const applyPresetTheme = (themeName: keyof typeof presetThemes) => {
    try {
      const theme = presetThemes[themeName];
      setConfig((prevConfig) => ({
        ...prevConfig,
        theme: themeName,
        ...theme,
        quickLinks: Array.isArray(prevConfig.quickLinks) ? prevConfig.quickLinks : [],
        social: prevConfig.social && typeof prevConfig.social === 'object' ? prevConfig.social : {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        },
      }));
    } catch (error: any) {
      console.error('Error applying preset theme:', error);
      setError('Failed to apply preset theme: ' + (error?.message || 'Unknown error'));
    }
  };

  const addQuickLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      setConfig((prevConfig) => ({
        ...prevConfig,
        quickLinks: [...(Array.isArray(prevConfig.quickLinks) ? prevConfig.quickLinks : []), { label: newLinkLabel, url: newLinkUrl }],
      }));
      setNewLinkLabel('');
      setNewLinkUrl('');
    }
  };

  const removeQuickLink = (index: number) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      quickLinks: (Array.isArray(prevConfig.quickLinks) ? prevConfig.quickLinks : []).filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading footer settings...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Footer Settings</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchFooterConfig();
          }}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Footer Manager</h2>
        <button
          onClick={() => setConfig({ ...config, is_visible: !config.is_visible })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            config.is_visible
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
        >
          {config.is_visible ? <Eye size={20} /> : <EyeOff size={20} />}
          {config.is_visible ? 'Visible' : 'Hidden'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="text-teal-500" size={24} />
          Preset Themes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Object.entries(presetThemes).map(([themeName, theme]) => (
            <button
              key={themeName}
              onClick={() => applyPresetTheme(themeName as keyof typeof presetThemes)}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.theme === themeName
                  ? 'border-teal-500 shadow-lg ring-2 ring-teal-300'
                  : 'border-gray-200 hover:border-teal-300 hover:shadow-md'
              }`}
            >
              <div
                className="h-16 rounded-md mb-2 shadow-inner"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                <div className="p-2 space-y-1">
                  <div
                    className="h-2 w-3/4 rounded"
                    style={{ backgroundColor: theme.headingColor }}
                  ></div>
                  <div
                    className="h-1 w-1/2 rounded"
                    style={{ backgroundColor: theme.textColor }}
                  ></div>
                  <div
                    className="h-1 w-2/3 rounded"
                    style={{ backgroundColor: theme.linkColor }}
                  ></div>
                </div>
              </div>
              <p className="text-xs font-semibold capitalize text-gray-700">{themeName}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Custom Colors</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <SingleColorPicker
            label="Background Color"
            value={config.backgroundColor}
            onChange={(color) => setConfig({ ...config, backgroundColor: color, theme: 'custom' })}
          />
          <SingleColorPicker
            label="Text Color"
            value={config.textColor}
            onChange={(color) => setConfig({ ...config, textColor: color, theme: 'custom' })}
          />
          <SingleColorPicker
            label="Heading Color"
            value={config.headingColor}
            onChange={(color) => setConfig({ ...config, headingColor: color, theme: 'custom' })}
          />
          <SingleColorPicker
            label="Link Color"
            value={config.linkColor}
            onChange={(color) => setConfig({ ...config, linkColor: color, theme: 'custom' })}
          />
          <SingleColorPicker
            label="Link Hover Color"
            value={config.linkHoverColor}
            onChange={(color) => setConfig({ ...config, linkHoverColor: color, theme: 'custom' })}
          />
          <SingleColorPicker
            label="Accent Color"
            value={config.accentColor}
            onChange={(color) => setConfig({ ...config, accentColor: color, theme: 'custom' })}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Company Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
            <input
              type="text"
              value={config.copyrightText}
              onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Phone className="text-teal-500" size={24} />
            Contact Information
          </h3>
          <button
            onClick={() => setConfig({ ...config, showContact: !config.showContact })}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              config.showContact ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {config.showContact ? 'Visible' : 'Hidden'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Mail className="text-gray-400 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Phone className="text-gray-400 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <MapPin className="text-gray-400 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Social Media Links</h3>
          <button
            onClick={() => setConfig({ ...config, showSocial: !config.showSocial })}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              config.showSocial ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {config.showSocial ? 'Visible' : 'Hidden'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Facebook className="text-blue-600 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="url"
                value={config.social?.facebook || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    social: {
                      ...(config.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }),
                      facebook: e.target.value
                    }
                  })
                }
                placeholder="https://facebook.com/yourpage"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Instagram className="text-pink-600 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="url"
                value={config.social?.instagram || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    social: {
                      ...(config.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }),
                      instagram: e.target.value
                    }
                  })
                }
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Twitter className="text-blue-400 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="url"
                value={config.social?.twitter || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    social: {
                      ...(config.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }),
                      twitter: e.target.value
                    }
                  })
                }
                placeholder="https://twitter.com/yourhandle"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Linkedin className="text-blue-700 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                value={config.social?.linkedin || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    social: {
                      ...(config.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }),
                      linkedin: e.target.value
                    }
                  })
                }
                placeholder="https://linkedin.com/company/yourcompany"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Youtube className="text-red-600 mt-2" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
              <input
                type="url"
                value={config.social?.youtube || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    social: {
                      ...(config.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }),
                      youtube: e.target.value
                    }
                  })
                }
                placeholder="https://youtube.com/@yourchannel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Quick Links</h3>
          <button
            onClick={() => setConfig({ ...config, showQuickLinks: !config.showQuickLinks })}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              config.showQuickLinks ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {config.showQuickLinks ? 'Visible' : 'Hidden'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Link Label"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={addQuickLink}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {Array.isArray(config.quickLinks) && config.quickLinks.length > 0 ? (
              config.quickLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="flex-1 font-medium">{link?.label || ''}</span>
                  <span className="flex-1 text-sm text-gray-600">{link?.url || ''}</span>
                  <button
                    onClick={() => removeQuickLink(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No quick links added yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Footer Settings'}
        </button>
      </div>
    </div>
  );
}
