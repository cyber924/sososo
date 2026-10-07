/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = '경제' | '드라마' | '스포츠' | 'IT' | '사회' | '랭킹' | '추천';

export interface Post {
  id: string;
  title: string;
  subTitle?: string;
  excerpt: string;
  content: string; // Markdown or simple HTML format
  category: CategoryType;
  imageUrl: string;
  author: string;
  createdAt: string; // ISO timestamp; format only for display
  updatedAt?: string;
  readTime: string;
  featured: boolean;
  views: number;
  tags: string[];
}

