/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface ImageGuardProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category: string;
  postId?: string;
}

export default function ImageGuard({ category, postId = '', src, alt, className, ...props }: ImageGuardProps) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // 100% Guaranteed-to-work, permanent, high-resolution premium Unsplash images curated for each theme.
  // Each category has 3 diverse top-tier photo assets for rich layout variance.
  const categoryPool: Record<string, string[]> = {
    '경제': [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800'
    ],
    '드라마': [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1478720568477-15109b3fef03?auto=format&fit=crop&q=80&w=800'
    ],
    '스포츠': [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800'
    ],
    'IT': [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
    ],
    '사회': [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
    ],
    '랭킹': [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'
    ],
    '영상': [
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
    ]
  };

  const getFallbackImage = () => {
    const pool = categoryPool[category] || categoryPool['IT'];
    
    // Hash-based deterministic picker to avoid showing identical fallbacks across different articles
    let hash = 0;
    const cleanId = postId || alt || 'default';
    for (let i = 0; i < cleanId.length; i++) {
      hash = cleanId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  };

  // Determine actual image source on load
  useEffect(() => {
    setHasError(false);
    
    // If we have a URL, check if it's broken or blank.
    const cleanSrc = (src && src.trim() && src.trim() !== 'undefined' && src.trim() !== 'null') ? src.trim() : '';
    
    if (!cleanSrc) {
      setCurrentSrc(getFallbackImage());
    } else {
      setCurrentSrc(cleanSrc);
    }
  }, [src, category, postId]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(getFallbackImage());
    }
  };

  if (!currentSrc) {
    return null; // Avoid rendering an empty src which causes the browser to download the current page again.
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
