'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Eye, EyeOff, Loader2, Link as LinkIcon, Instagram, Facebook, Twitter, Mail, MessageCircle, Linkedin, Youtube, AtSign, Sparkles } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
}

const PLATFORM_ICONS = {
  instagram: { Icon: Instagram, label: 'Instagram' },
  facebook: { Icon: Facebook, label: 'Facebook' },
  twitter: { Icon: Twitter, label: 'Twitter' },
  email: { Icon: Mail, label: 'Email' },
  whatsapp: { Icon: MessageCircle, label: 'WhatsApp' },
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  youtube: { Icon: Youtube, label: 'YouTube' },
  tiktok: { Icon: AtSign, label: 'TikTok' },
  custom: { Icon: LinkIcon, label: 'Custom Link' }
};

export default function BannerSocialManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bannerData, setBannerData] = useState({
    title: 'Welcome to Pixie Blooms!',
    subtitle: 'Discover our exclusive collection of handcrafted hair accessories',
    isVisible: true,
    bg_color: '#ffffff',
    text_color: '#000000'
  });

  const [socialSettings, setSocialSettings] = useState({
    bg_color: '#f5f5f5',
    text_color: '#000000'
  });

  const [socialLinksVisible, setSocialLinksVisible] = useState(true);
  const [smartFeatureFABVisible, setSmartFeatureFABVisible] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({
    platform: 'instagram',
    url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const bannerRef = ref(db, 'site_content/welcome_banner');
      const bannerSnapshot = await get(bannerRef);
      if (bannerSnapshot.exists()) {
        const data = bannerSnapshot.val();
        if (data.value) {
          setBannerData(data.value);
        }
      }

      const socialVisibilityRef = ref(db, 'site_content/social_links_visible');
      const socialVisSnapshot = await get(socialVisibilityRef);
      if (socialVisSnapshot.exists()) {
        setSocialLinksVisible(socialVisSnapshot.val());
      }

      const sectionsVisibilityRef = ref(db, 'default_sections_visibility');
      const sectionsVisSnapshot = await get(sectionsVisibilityRef);
      if (sectionsVisSnapshot.exists()) {
        const data = sectionsVisSnapshot.val();
        setSmartFeatureFABVisible(data.smart_feature_fab !== undefined ? data.smart_feature_fab : false);
      }

      const socialRef = ref(db, 'social_links');
      const socialSnapshot = await get(socialRef);
      if (socialSnapshot.exists()) {
        const data = socialSnapshot.val();
        const linksArray = Object.entries(data).map(([id, link]: [string, any]) => ({
          id,
          ...link
        }));
        setSocialLinks(linksArray.sort((a, b) => a.order - b.order));
      } else {
        const defaultLinks: SocialLink[] = [
          {
            id: 'default_instagram',
            platform: 'instagram',
            url: 'https://www.instagram.com/pixieblooms',
            icon: 'instagram',
            order: 0
          },
          {
            id: 'default_email',
            platform: 'email',
            url: 'mailto:pixieblooms2512@gmail.com',
            icon: 'email',
            order: 1
          }
        ];
        setSocialLinks(defaultLinks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBanner = async () => {
    try {
      setSaving(true);
      const bannerRef = ref(db, 'site_content/welcome_banner');
      await set(bannerRef, {
        value: bannerData,
        updated_at: new Date().toISOString()
      });
      alert('Welcome banner settings saved successfully!');
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleBannerVisibility = async () => {
    try {
      const newBannerData = { ...bannerData, isVisible: !bannerData.isVisible };
      setBannerData(newBannerData);
      const bannerRef = ref(db, 'site_content/welcome_banner');
      await set(bannerRef, {
        value: newBannerData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling banner visibility:', error);
      alert('Failed to toggle banner visibility');
    }
  };

  const addSocialLink = async () => {
    if (!newLink.url || newLink.url.trim() === '') {
      alert('Please enter a URL');
      return;
    }

    if (newLink.platform === 'email' && !newLink.url.includes('mailto:') && !newLink.url.includes('@')) {
      alert('Email link should be in format: mailto:example@email.com or example@email.com');
      return;
    }

    if (newLink.platform !== 'email' && !newLink.url.startsWith('http://') && !newLink.url.startsWith('https://')) {
      alert('URL should start with http:// or https://');
      return;
    }

    try {
      setSaving(true);
      const newId = `link_${Date.now()}`;
      const newSocialLink: SocialLink = {
        id: newId,
        platform: newLink.platform,
        url: newLink.url.trim(),
        icon: newLink.platform,
        order: socialLinks.length
      };

      const updatedLinks = [...socialLinks, newSocialLink];
      const linksData: any = {};
      updatedLinks.forEach(link => {
        linksData[link.id] = {
          platform: link.platform,
          url: link.url,
          icon: link.icon,
          order: link.order
        };
      });

      console.log('Saving social links:', linksData);
      await set(ref(db, 'social_links'), linksData);
      setSocialLinks(updatedLinks);
      setNewLink({ platform: 'instagram', url: '' });
      setShowAddLink(false);
      alert('Social link added successfully!');
    } catch (error: any) {
      console.error('Error adding social link:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to add social link: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteSocialLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return;

    try {
      await remove(ref(db, `social_links/${id}`));
      setSocialLinks(socialLinks.filter(link => link.id !== id));
      alert('Social link deleted successfully!');
    } catch (error) {
      console.error('Error deleting social link:', error);
      alert('Failed to delete social link');
    }
  };

  const toggleSocialLinksVisibility = async () => {
    try {
      const newVisibility = !socialLinksVisible;
      setSocialLinksVisible(newVisibility);
      const visibilityRef = ref(db, 'site_content/social_links_visible');
      await set(visibilityRef, newVisibility);
    } catch (error) {
      console.error('Error toggling social links visibility:', error);
      alert('Failed to toggle social links visibility');
    }
  };

  const toggleSmartFeatureFAB = async () => {
    try {
      const newVisibility = !smartFeatureFABVisible;
      setSmartFeatureFABVisible(newVisibility);

      const sectionsRef = ref(db, 'default_sections_visibility');
      const snapshot = await get(sectionsRef);
      const currentData = snapshot.exists() ? snapshot.val() : {};

      await set(sectionsRef, {
        ...currentData,
        smart_feature_fab: newVisibility
      });

      alert(`Smart Feature FAB ${newVisibility ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling smart feature FAB:', error);
      alert('Failed to toggle smart feature FAB');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border-2 border-teal-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Banner</h2>
          <button
            onClick={toggleBannerVisibility}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              bannerData.isVisible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {bannerData.isVisible ? (
              <>
                <Eye className="w-4 h-4" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Banner Title *
            </label>
            <input
              type="text"
              value={bannerData.title}
              onChange={(e) => setBannerData({ ...bannerData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
              placeholder="e.g., Welcome to Pixie Blooms!"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Banner Subtitle *
            </label>
            <input
              type="text"
              value={bannerData.subtitle}
              onChange={(e) => setBannerData({ ...bannerData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
              placeholder="e.g., Discover our exclusive collection of handcrafted hair accessories"
            />
          </div>

          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-teal-50 border-2 border-teal-100 rounded-lg p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">Preview:</p>
            <p className="text-sm text-gray-600 font-medium">
              {bannerData.title} - {bannerData.subtitle}
            </p>
          </div>

          <button
            onClick={saveBanner}
            disabled={saving}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Banner
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Smart Feature FAB</h2>
          <button
            onClick={toggleSmartFeatureFAB}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              smartFeatureFABVisible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {smartFeatureFABVisible ? (
              <>
                <Eye className="w-4 h-4" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">About Smart Features</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                The Smart Feature FAB (Floating Action Button) appears on the home page and provides quick access to two powerful features:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Virtual Try-On
              </h4>
              <p className="text-sm text-gray-600">
                Browse and try on products that have AR try-on enabled
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-pink-200">
              <h4 className="font-bold text-pink-600 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
                Match Your Dress
              </h4>
              <p className="text-sm text-gray-600">
                Find accessories that match dress colors using AI
              </p>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> The FAB will only appear when enabled. Make sure to configure products with try-on settings and available colors for the features to work properly.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleSocialLinksVisibility}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                socialLinksVisible
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {socialLinksVisible ? (
                <>
                  <Eye className="w-4 h-4" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hidden
                </>
              )}
            </button>
            <button
              onClick={() => setShowAddLink(!showAddLink)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showAddLink ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Link
                </>
              )}
            </button>
          </div>
        </div>

        {showAddLink && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Social Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Platform *
                </label>
                <select
                  value={newLink.platform}
                  onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {Object.entries(PLATFORM_ICONS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="text"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder={
                    newLink.platform === 'email'
                      ? 'mailto:example@email.com'
                      : 'https://example.com'
                  }
                />
              </div>

              <button
                onClick={addSocialLink}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Add Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialLinks.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-gray-200">
              No social links yet. Click "Add Link" to create one.
            </div>
          ) : (
            socialLinks.map((link) => {
              const { Icon, label } = PLATFORM_ICONS[link.icon as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.custom;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[200px]">{link.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSocialLink(link.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
