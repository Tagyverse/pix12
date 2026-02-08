import { Instagram, Mail, Facebook, Twitter, MessageCircle, Linkedin, Youtube, AtSign, Link as LinkIcon } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
}

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  email: Mail,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: AtSign,
  custom: LinkIcon
};

export default function WelcomeBanner() {
  const { data: publishedData } = usePublishedData();
  
  const defaultBannerContent = {
    title: 'Welcome to Pixie Blooms!',
    subtitle: 'Discover our exclusive collection of handcrafted hair accessories',
    isVisible: true
  };

  const bannerContent = publishedData?.site_content?.welcome_banner?.value || defaultBannerContent;
  
  if (publishedData?.site_content?.welcome_banner?.value) {
    console.log('[WELCOME-BANNER] Using published banner data');
  }

  const defaultSocialLinks: SocialLink[] = [
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

  let socialLinks: SocialLink[] = defaultSocialLinks;
  if (publishedData?.social_links) {
    console.log('[WELCOME-BANNER] Using published social links');
    const linksArray = Object.entries(publishedData.social_links).map(([id, link]: [string, any]) => ({
      id,
      ...link
    }));
    socialLinks = linksArray.sort((a, b) => a.order - b.order);
  } else {
    console.log('[WELCOME-BANNER] Using default social links');
  }

  if (!bannerContent.isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-500 to-mint-500 text-white py-6 px-4 text-center">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{bannerContent.title}</h2>
        <p className="text-sm md:text-base mb-4">{bannerContent.subtitle}</p>
        
        <div className="flex justify-center items-center gap-4 mt-4">
          {socialLinks.map((social) => {
            const IconComponent = PLATFORM_ICONS[social.platform as keyof typeof PLATFORM_ICONS] || LinkIcon;
            return (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all transform hover:scale-110"
                aria-label={social.platform}
              >
                <IconComponent className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
