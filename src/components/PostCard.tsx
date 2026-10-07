/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Post } from '../types';
import { Eye, Clock, ArrowUpRight } from 'lucide-react';
import ImageGuard from './ImageGuard';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  isHero?: boolean;
}

export default function PostCard({ post, onClick, isHero = false }: PostCardProps) {
  // Color map for subtle editorial topic tags
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case '경제':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case '드라마':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case '스포츠':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'IT':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case '사회':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-50 text-neutral-800 border-neutral-200';
    }
  };

  if (isHero) {
    return (
      <a 
        href={`/blog/${post.id}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            onClick();
          }
        }}
        className="block no-underline text-inherit mb-6"
      >
        <article 
          className="group cursor-pointer grid grid-cols-1 lg:grid-cols-12 border border-neutral-900 bg-white overflow-hidden transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(225,29,72,0.15)] hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          {/* Hero Image Section */}
          <div className="lg:col-span-6 relative h-48 sm:h-72 lg:h-80 overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-900 bg-neutral-100">
            <ImageGuard
              category={post.category}
              postId={post.id}
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
              loading="lazy"
            />
            <div className="absolute top-3 left-3">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border rounded-none ${getCategoryStyles(post.category)}`}>
                ★ {post.category} FEATURED
              </span>
            </div>
          </div>

          {/* Hero Text Section */}
          <div className="lg:col-span-6 p-4 sm:p-6 flex flex-col justify-between bg-white">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                <span className="font-bold text-neutral-800">{post.author}</span>
                <span>•</span>
                <span>{post.createdAt}</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 leading-tight group-hover:text-rose-600 transition-colors duration-200">
                {post.title}
              </h2>

              {post.subTitle && (
                <p className="font-serif text-sm text-neutral-500 italic leading-relaxed">
                  {post.subTitle}
                </p>
              )}

              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs font-mono text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-neutral-400" />
                  {post.readTime}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={13} className="text-neutral-400" />
                  {post.views.toLocaleString()} views
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-neutral-900 uppercase group-hover:text-rose-600 transition-colors">
                Read Article <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        </article>
      </a>
    );
  }

  // Normal Grid Card
  return (
    <a
      href={`/blog/${post.id}`}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          onClick();
        }
      }}
      className="block no-underline text-inherit h-full"
    >
      <article
        className="group cursor-pointer flex flex-col border border-neutral-300 bg-white overflow-hidden transition-all duration-300 hover:border-neutral-950 hover:shadow-[3px_3px_0px_0px_rgba(23,23,23,0.1)] hover:-translate-x-0.5 hover:-translate-y-0.5 h-full"
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] overflow-hidden border-b border-neutral-200 bg-neutral-100">
          <ImageGuard
            category={post.category}
            postId={post.id}
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
            loading="lazy"
          />
          <div className="absolute top-2 left-2">
            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border ${getCategoryStyles(post.category)}`}>
              {post.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="font-bold text-neutral-800">{post.author}</span>
              <span>{post.createdAt}</span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-black text-neutral-900 leading-snug group-hover:text-rose-600 transition-colors duration-200 line-clamp-2">
              {post.title}
            </h3>

            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {post.views}
              </span>
            </div>
            <span className="font-bold text-neutral-900 group-hover:text-rose-600 uppercase flex items-center gap-0.5">
              View <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}
