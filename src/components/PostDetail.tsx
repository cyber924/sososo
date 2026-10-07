/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { ArrowLeft, Clock, Eye, Share2, Heart, MessageSquare, Sparkles, Check } from 'lucide-react';
import ImageGuard from './ImageGuard';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
}

export default function PostDetail({ post, onBack }: PostDetailProps) {
  const [likes, setLikes] = useState(Math.floor(post.views / 15) + 12);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic Client-side SEO update for SPA transitions
  useEffect(() => {
    const siteUrl = window.location.origin;
    const canonicalUrl = `${siteUrl}/blog/${encodeURIComponent(post.id)}`;
    const siteName = '소소한 웹진';
    const pageTitle = `${post.title} | ${siteName}`;
    const pageDesc = post.excerpt || post.subTitle || '소소한 웹진 프리미엄 에디토리얼 칼럼';

    // 1. Title
    document.title = pageTitle;

    // 2. Canonical
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Helper to update meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // 3. Meta descriptions & OpenGraph
    setMetaTag('name', 'description', pageDesc);
    setMetaTag('name', 'robots', 'index, follow');
    setMetaTag('property', 'og:type', 'article');
    setMetaTag('property', 'og:title', post.title);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:image', post.imageUrl);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'article:published_time', post.createdAt);
    setMetaTag('property', 'article:modified_time', post.updatedAt || post.createdAt);

    // 4. Schema.org BlogPosting & BreadcrumbList JSON-LD
    const blogPostingData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": pageDesc,
      "image": post.imageUrl,
      ...(post.createdAt ? { datePublished: post.createdAt } : {}),
      ...((post.updatedAt || post.createdAt) ? { dateModified: post.updatedAt || post.createdAt } : {}),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "author": {
        "@type": "Organization",
        "name": siteName
      },
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "url": siteUrl
      }
    };

    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "홈",
          "item": `${siteUrl}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": post.category,
          "item": `${siteUrl}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": post.title,
          "item": canonicalUrl
        }
      ]
    };

    let blogPostingScript = document.getElementById('seo-blog-posting') as HTMLScriptElement | null;
    if (!blogPostingScript) {
      blogPostingScript = document.createElement('script');
      blogPostingScript.id = 'seo-blog-posting';
      blogPostingScript.type = 'application/ld+json';
      document.head.appendChild(blogPostingScript);
    }
    blogPostingScript.textContent = JSON.stringify(blogPostingData, null, 2);

    let breadcrumbScript = document.getElementById('seo-breadcrumb') as HTMLScriptElement | null;
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'seo-breadcrumb';
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData, null, 2);

    return () => {
      // Clean up post-specific JSON-LD scripts on unmount
      const bp = document.getElementById('seo-blog-posting');
      if (bp) bp.remove();
      const bc = document.getElementById('seo-breadcrumb');
      if (bc) bc.remove();
    };
  }, [post]);

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setHasLiked(!hasLiked);
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper function to dynamically parse and render the article elegantly
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Normalize text into clean paragraphs
    let paragraphs: string[] = [];
    if (content.includes('<p>')) {
      const matches = content.match(/<p>([\s\S]*?)<\/p>/g);
      if (matches) {
        paragraphs = matches.map(m => m.replace(/<\/?p>/g, '').trim()).filter(Boolean);
      } else {
        paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
      }
    } else {
      paragraphs = content.split(/\n+/).map(p => p.trim()).filter(Boolean);
    }

    if (paragraphs.length === 0) {
      paragraphs = [content];
    }

    // Generate smart editorial insights from the first few lines of the text
    const firstParagraph = paragraphs[0] || '';
    const sentences = firstParagraph.split(/[.!?]\s+/).filter(s => s.length > 5).slice(0, 3);
    const insights = sentences.map(s => s.trim().replace(/^[^\w가-힣]+/, '') + '.');

    return (
      <div className="space-y-8 text-neutral-800 font-serif leading-relaxed text-base sm:text-lg md:text-xl">
        
        {/* Editorial Highlight Box (Top Highlight Board) */}
        <div className="bg-[#FAF9F6] border-l-4 border-rose-600 p-4 sm:p-5 my-6 space-y-2.5 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-rose-600 tracking-widest block uppercase">
            ✦ EDITOR'S KEY INSIGHT // 관전 포인트
          </span>
          <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-700 font-serif">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="text-rose-500 font-mono font-bold">0{idx + 1}.</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))
            ) : (
              <li className="flex gap-2 items-start">
                <span className="text-rose-500 font-mono font-bold">01.</span>
                <span>본 아티클이 제기하는 인문학적 성찰과 시대상의 행간을 주의 깊게 추적해보십시오.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Dynamic paragraph mapping */}
        {paragraphs.map((para, index) => {
          let cleanPara = para.replace(/<[^>]*>/g, '').trim();
          if (!cleanPara) return null;

          // 1. Elegant Drop Cap for the first paragraph
          if (index === 0 && cleanPara.length > 2) {
            const firstChar = cleanPara[0];
            const remainingText = cleanPara.slice(1);
            return (
              <p key={index} className="text-neutral-800 leading-relaxed text-justify mb-4 first-letter:float-left first-letter:text-5xl first-letter:font-black first-letter:text-rose-600 first-letter:mr-2.5 first-letter:mt-1 font-serif">
                <span className="text-5xl font-serif font-black text-rose-600 float-left mr-2.5 mt-1 leading-none select-none">
                  {firstChar}
                </span>
                {formatEmojisAndSentences(remainingText)}
              </p>
            );
          }

          // 2. Mid-article Pull-Quote formatting
          const isQuestion = cleanPara.includes('?') && cleanPara.length < 140;
          const isEmphasis = (cleanPara.startsWith('"') || cleanPara.startsWith('“')) && cleanPara.length < 180;
          
          if ((index === 2 || index === 4 || isQuestion || isEmphasis) && cleanPara.length > 30 && cleanPara.length < 240) {
            return (
              <div key={index} className="my-8 py-5 border-y border-neutral-200 text-center bg-[#FCFCFB] px-6 relative">
                <span className="text-neutral-300 text-4xl font-serif leading-none block h-2 select-none">“</span>
                <p className="font-serif text-sm sm:text-base md:text-lg font-black italic text-neutral-900 px-4 leading-relaxed max-w-2xl mx-auto">
                  {cleanPara.replace(/["“”]/g, '')}
                </p>
                <span className="text-neutral-300 text-4xl font-serif leading-none block h-2 text-right mt-1 select-none">”</span>
              </div>
            );
          }

          // 3. Normal paragraph
          return (
            <p key={index} className="text-neutral-800 text-justify leading-relaxed mb-4 font-serif">
              {formatEmojisAndSentences(cleanPara)}
              
              {/* End of article mark for the last paragraph */}
              {index === paragraphs.length - 1 && (
                <span className="inline-flex items-center ml-2 text-[9px] font-mono font-bold text-rose-600 tracking-wider bg-rose-50 border border-rose-200 px-1 py-0.5 select-none">
                  ■ B SITE END
                </span>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  // Replace raw emojis with modern inline highlighted badges
  const formatEmojisAndSentences = (text: string) => {
    const emojiRegex = /([📌🚀💡🔑🎨🛠️📢✍️✨🏆🔥🌟🧭🎭🔍💎📝🎬🥊📣🤝📢])/g;
    if (!emojiRegex.test(text)) {
      return text;
    }

    const parts = text.split(emojiRegex);
    return parts.map((part, index) => {
      if (part.match(emojiRegex)) {
        return (
          <span key={index} className="inline-flex items-center justify-center bg-rose-50 text-rose-700 border border-rose-100 rounded-none px-1.5 py-0.5 mx-1 font-sans text-xs font-bold leading-none select-none">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article className="bg-[#FAF9F6] min-h-screen pb-20">
      {/* Editorial Navigation Header */}
      <div className="sticky top-0 z-10 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm font-serif font-bold text-neutral-900 hover:text-rose-600 transition-colors"
            id="back-button"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            <span>목록으로 돌아가기</span>
          </button>

          <div className="flex items-center gap-4 relative">
            <button 
              className="p-2 text-neutral-600 hover:text-rose-600 hover:bg-neutral-100 transition-all rounded-full relative"
              onClick={handleShare}
              title="공유하기"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
            </button>

            {/* Custom elegant toast */}
            {copied && (
              <span className="absolute -bottom-10 right-0 bg-neutral-950 text-white text-[10px] font-mono px-2.5 py-1 shadow-md whitespace-nowrap border border-neutral-800 animate-fade-in animate-pulse">
                URL COPIED TO CLIPBOARD
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main post layout */}
      <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12">
        
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-neutral-900 text-white text-xs font-mono font-bold tracking-wider uppercase">
            {post.category}
          </span>
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2 py-1">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title: Pretendard font, compact size so it fits in a single line / paragraph cleanly */}
        <h1 className="font-pretendard text-lg sm:text-xl md:text-2xl font-bold text-neutral-950 leading-snug sm:leading-normal tracking-tight break-keep mb-3">
          {post.title}
        </h1>

        {/* Subtitle */}
        {post.subTitle && (
          <p className="font-pretendard text-xs sm:text-sm md:text-base text-neutral-600 font-normal leading-relaxed border-l-4 border-rose-600 pl-3 sm:pl-4 my-4 bg-rose-50/20 py-1.5 break-keep">
            {post.subTitle}
          </p>
        )}

        {/* Author / Date Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-neutral-300 py-3 my-6 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-900">{post.author}</span>
            <span>•</span>
            <span>작성일 {post.createdAt.slice(0, 10).replace(/-/g, '.')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={13} />
              조회수 {post.views.toLocaleString()}회
            </span>
          </div>
        </div>

        {/* Feature Banner Image */}
        <div className="my-8 aspect-[16/9] overflow-hidden border border-neutral-900 bg-neutral-100">
          <ImageGuard
            category={post.category}
            postId={post.id}
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-center text-xs text-neutral-400 italic mb-8">
          출처: Unsplash (Premium Editorial Curation)
        </p>

        {/* Rich Post Body Content - Formatted dynamically */}
        <div className="prose prose-neutral max-w-none font-serif text-base sm:text-lg md:text-xl leading-relaxed text-neutral-800 space-y-6 selection:bg-rose-500 selection:text-white">
          {renderFormattedContent(post.content)}
        </div>

        {/* Post footer & interaction metrics */}
        <div className="border-t border-neutral-300 mt-16 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-mono font-bold tracking-tight uppercase transition-all duration-200 ${
                hasLiked
                  ? 'bg-rose-50 border-rose-600 text-rose-600 scale-105'
                  : 'bg-white border-neutral-300 hover:border-neutral-900 text-neutral-700'
              }`}
            >
              <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
              <span>좋아요 {likes}</span>
            </button>

            <span className="text-xs font-mono text-neutral-500 flex items-center gap-1.5">
              <MessageSquare size={14} />
              댓글 (오픈형 읽기전용)
            </span>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-serif font-bold text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 transition-all"
          >
            목록으로
          </button>
        </div>
      </div>
    </article>
  );
}

