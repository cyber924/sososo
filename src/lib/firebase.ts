/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Post, CategoryType } from '../types.ts';

// 1. Firebase configuration credentials for Central Hub (A Site)
const firebaseConfig = {
  apiKey: "AIzaSyBqzTT5luZHM11rLCMd-xpiRUXZAHxBH1w",
  authDomain: "weather-49c44.firebaseapp.com",
  projectId: "weather-49c44",
  storageBucket: "weather-49c44.firebasestorage.app",
  messagingSenderId: "955988264431",
  appId: "1:955988264431:web:3a82dcbe4269f4e65aa21a"
};

// 2. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 3. Initialize Firestore with custom Multi-Database ID
export const db = initializeFirestore(app, {}, "ai-studio-aiwebzineblog-dadec710-29d0-43c4-a8a2-3bed7e263772");

// Map Central Hub categories to B Site's categories
const categoryMap: Record<string, CategoryType> = {
  '기술/IT': 'IT',
  '경제/금융': '경제',
  '연예/드라마': '드라마',
  '스포츠': '스포츠',
  '사회/문화': '사회',
  'IT': 'IT',
  '경제': '경제',
  '드라마': '드라마',
  '사회': '사회'
};

// Format ISO 8601 string to YYYY.MM.DD format
function formatCreatedAt(isoString?: string): string {
  try {
    if (!isoString) {
      const today = new Date();
      return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  } catch (e) {
    return isoString || '';
  }
}

// Calculate human-friendly reading time based on character count (approx 450 characters/min for Korean)
function calculateReadTime(content: string): string {
  if (!content) return '1 min read';
  // Strip HTML tags for word count
  const cleanText = content.replace(/<[^>]*>/g, '').trim();
  const minutes = Math.max(1, Math.round(cleanText.length / 450));
  return `${minutes} min read`;
}

/**
 * Fetches original AI-generated articles from the Central Hub database (A Site)
 * and maps them into polished Post instances for B Site's custom UI.
 */
export async function fetchOriginalPostsFromHub(): Promise<Post[]> {
  try {
    const postsRef = collection(db, "posts");
    // Query sorted by creation date descending
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const mappedPosts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Determine final category (defaulting to IT if unknown)
      const rawCategory = data.category || '기술/IT';
      const mappedCategory = categoryMap[rawCategory] || 'IT';
      
      // Convert summary/excerpt
      const excerpt = data.summary || data.excerpt || '상세 보기 기사 본문을 참조하십시오.';
      
      // Cover image fallback matching categories elegantly
      const defaultImages: Record<CategoryType, string> = {
        '경제': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
        '드라마': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
        '스포츠': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
        'IT': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
        '사회': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800',
        '랭킹': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
        '추천': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'
      };
      const imageUrl = data.coverImage || data.imageUrl || defaultImages[mappedCategory];
      
      // Parse author field robustly (handles user profile objects or simple strings)
      let finalAuthor = 'AI 오리지널 콘텐츠';
      if (data.author) {
        if (typeof data.author === 'object' && data.author !== null) {
          finalAuthor = data.author.displayName || data.author.email || 'AI 오리지널 콘텐츠';
        } else if (typeof data.author === 'string') {
          finalAuthor = data.author;
        }
      }
      
      mappedPosts.push({
        id: doc.id,
        title: typeof data.title === 'string' ? data.title : '무제 기사',
        subTitle: typeof data.subtitle === 'string' ? data.subtitle : (typeof data.subTitle === 'string' ? data.subTitle : undefined),
        excerpt: typeof excerpt === 'string' ? excerpt : '상세 보기 기사 본문을 참조하십시오.',
        content: typeof data.content === 'string' ? data.content : '',
        category: mappedCategory,
        imageUrl: imageUrl,
        author: finalAuthor,
        createdAt: formatCreatedAt(data.createdAt),
        readTime: calculateReadTime(typeof data.content === 'string' ? data.content : ''),
        featured: false, // will designate later based on views/newest
        views: Number(data.views) || 0,
        tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : ['에디토리얼', '중앙허브']
      });
    });

    if (mappedPosts.length > 0) {
      // Dynamically select a featured candidate from recent posts rather than freezing on the highest view post
      const candidateIndex = Math.floor(Math.random() * Math.min(mappedPosts.length, 5));
      mappedPosts[candidateIndex].featured = true;
    }
    
    return mappedPosts;
  } catch (error) {
    console.error("[B Site Engine] Failed to fetch data from central AI hub:", error);
    // Return empty array to trigger mock fallback gracefully
    return [];
  }
}
