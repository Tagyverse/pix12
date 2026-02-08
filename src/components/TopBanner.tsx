import { usePublishedData } from '../contexts/PublishedDataContext';

export default function TopBanner() {
  const { data: publishedData } = usePublishedData();
  
  const defaultContent = {
    text: '🎉 Grand Opening Sale! Get 20% OFF on all items!',
    isVisible: true,
    backgroundColor: '#f59e0b'
  };

  let bannerContent = defaultContent;
  
  if (publishedData?.site_content?.top_banner?.value) {
    console.log('[TOP-BANNER] Using published data');
    bannerContent = publishedData.site_content.top_banner.value;
  } else {
    console.log('[TOP-BANNER] Using default content');
  }
  
  if (publishedData?.default_sections_visibility?.marquee !== undefined) {
    bannerContent = { ...bannerContent, isVisible: publishedData.default_sections_visibility.marquee && bannerContent.isVisible };
  }

  if (!bannerContent.isVisible) {
    return null;
  }

  return (
    <div
      className="text-white py-2 overflow-hidden"
      style={{ backgroundColor: bannerContent.backgroundColor }}
    >
      <div className="animate-marquee whitespace-nowrap inline-block">
        <span className="text-sm font-semibold mx-8">{bannerContent.text}</span>
        <span className="text-sm font-semibold mx-8">{bannerContent.text}</span>
        <span className="text-sm font-semibold mx-8">{bannerContent.text}</span>
        <span className="text-sm font-semibold mx-8">{bannerContent.text}</span>
      </div>
    </div>
  );
}
