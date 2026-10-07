/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './src/lib/firebase.ts';
import { mockPosts } from './src/mockData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const SITE_NAME = '소소한 웹진';
const DEFAULT_FALLBACK_URL = 'https://ais-pre-nnifhwnq3uikrmvot24squ-436251446387.asia-northeast1.run.app';

function getBaseUrl(req: Request): string {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host') || DEFAULT_FALLBACK_URL.replace(/^https?:\/\//, '');
  return `${proto}://${host}`.replace(/\/+$/, '');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIsoDate(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {
    // fallback
  }
  return new Date().toISOString();
}

interface SanitizedPost {
  id: string;
  title: string;
  subTitle?: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  readTime: string;
  featured: boolean;
  views: number;
  tags: string[];
}

async function getPostById(id: string): Promise<SanitizedPost | null> {
  try {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Check if deleted, draft or private
      if (data.status === 'draft' || data.status === 'private' || data.isPublished === false) {
        return null;
      }

      // Check if scheduled for future
      if (data.createdAt && new Date(data.createdAt).getTime() > Date.now()) {
        return null;
      }

      let authorName = '소소한 웹진';
      if (data.author) {
        if (typeof data.author === 'object') {
          authorName = data.author.displayName || data.author.email || '소소한 웹진';
        } else if (typeof data.author === 'string') {
          authorName = data.author;
        }
      }

      const createdAtIso = formatIsoDate(data.createdAt);
      const updatedAtIso = formatIsoDate(data.updatedAt || data.modifiedAt || data.publishedAt || data.createdAt);

      return {
        id: docSnap.id,
        title: typeof data.title === 'string' ? data.title : '무제 기사',
        subTitle: typeof data.subtitle === 'string' ? data.subtitle : (typeof data.subTitle === 'string' ? data.subTitle : undefined),
        excerpt: typeof data.summary === 'string' ? data.summary : (typeof data.excerpt === 'string' ? data.excerpt : '소소한 웹진 고품격 에디토리얼 칼럼'),
        content: typeof data.content === 'string' ? data.content : '',
        category: typeof data.category === 'string' ? data.category : 'IT',
        imageUrl: data.coverImage || data.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
        author: authorName,
        createdAt: createdAtIso,
        updatedAt: updatedAtIso,
        readTime: '4 min read',
        featured: Boolean(data.featured),
        views: Number(data.views) || 0,
        tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : ['에디토리얼', '웹진']
      };
    }
  } catch (error) {
    console.error(`[Server] Error getting post ${id} from Firestore:`, error);
  }

  // Fallback: check mockPosts
  const mock = mockPosts.find(p => p.id === id);
  if (mock) {
    return {
      ...mock,
      createdAt: formatIsoDate(mock.createdAt),
      updatedAt: formatIsoDate(new Date())
    };
  }

  return null;
}

async function getAllPublicPosts(): Promise<SanitizedPost[]> {
  const posts: SanitizedPost[] = [];

  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter out draft, private, unpublished
      if (data.status === 'draft' || data.status === 'private' || data.isPublished === false) {
        return;
      }

      // Filter out scheduled future posts
      if (data.createdAt && new Date(data.createdAt).getTime() > Date.now()) {
        return;
      }

      let authorName = '소소한 웹진';
      if (data.author) {
        if (typeof data.author === 'object') {
          authorName = data.author.displayName || data.author.email || '소소한 웹진';
        } else if (typeof data.author === 'string') {
          authorName = data.author;
        }
      }

      const createdAtIso = formatIsoDate(data.createdAt);
      const updatedAtIso = formatIsoDate(data.updatedAt || data.modifiedAt || data.publishedAt || data.createdAt);

      posts.push({
        id: docSnap.id,
        title: typeof data.title === 'string' ? data.title : '무제 기사',
        subTitle: typeof data.subtitle === 'string' ? data.subtitle : (typeof data.subTitle === 'string' ? data.subTitle : undefined),
        excerpt: typeof data.summary === 'string' ? data.summary : (typeof data.excerpt === 'string' ? data.excerpt : '소소한 웹진 고품격 에디토리얼 칼럼'),
        content: typeof data.content === 'string' ? data.content : '',
        category: typeof data.category === 'string' ? data.category : 'IT',
        imageUrl: data.coverImage || data.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
        author: authorName,
        createdAt: createdAtIso,
        updatedAt: updatedAtIso,
        readTime: '4 min read',
        featured: Boolean(data.featured),
        views: Number(data.views) || 0,
        tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : ['에디토리얼', '웹진']
      });
    });
  } catch (error) {
    console.error('[Server] Error fetching all posts from Firestore:', error);
  }

  // Fallback to mockPosts if Firestore returns empty
  if (posts.length === 0) {
    return mockPosts.map(p => ({
      ...p,
      createdAt: formatIsoDate(p.createdAt),
      updatedAt: formatIsoDate(new Date())
    }));
  }

  return posts;
}

async function startServer() {
  const app = express();

  let vite: any;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }

  // 1. Dynamic robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const siteUrl = getBaseUrl(req);
    res.type('text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  // 2. Dynamic sitemap.xml with real lastmod and complete public articles
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const siteUrl = getBaseUrl(req);
      const posts = await getAllPublicPosts();

      let latestSiteMod = new Date().toISOString();
      if (posts.length > 0 && posts[0].updatedAt) {
        latestSiteMod = posts[0].updatedAt;
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Main Homepage
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}</loc>\n`;
      xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>1.0</priority>\n`;
      xml += `  </url>\n`;

      // Public Blog Posts
      for (const post of posts) {
        xml += `  <url>\n`;
        xml += `    <loc>${siteUrl}/blog/${post.id}</loc>\n`;
        xml += `    <lastmod>${post.updatedAt}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      res.send(xml);
    } catch (err) {
      console.error('[Server] Sitemap generation error:', err);
      res.status(500).type('text/plain').send('Error generating sitemap.xml');
    }
  });

  // 3. Dynamic RSS 2.0 Feed for Naver Search Advisor & Feed Readers
  app.get('/rss.xml', async (req: Request, res: Response) => {
    try {
      const siteUrl = getBaseUrl(req);
      const posts = await getAllPublicPosts();
      const buildDate = new Date().toUTCString();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
      xml += `  <channel>\n`;
      xml += `    <title>${SITE_NAME}</title>\n`;
      xml += `    <link>${siteUrl}</link>\n`;
      xml += `    <description>전문적인 내용과 지식을 깊이 있게 담아낸 고품격 명품 웹진</description>\n`;
      xml += `    <language>ko-KR</language>\n`;
      xml += `    <lastBuildDate>${buildDate}</lastBuildDate>\n`;
      xml += `    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;

      for (const post of posts.slice(0, 50)) {
        const pubDate = new Date(post.createdAt).toUTCString();
        xml += `    <item>\n`;
        xml += `      <title><![CDATA[${post.title}]]></title>\n`;
        xml += `      <link>${siteUrl}/blog/${post.id}</link>\n`;
        xml += `      <description><![CDATA[${post.excerpt}]]></description>\n`;
        xml += `      <author>sungbae0613@gmail.com (${escapeXml(post.author)})</author>\n`;
        xml += `      <category>${escapeXml(post.category)}</category>\n`;
        xml += `      <pubDate>${pubDate}</pubDate>\n`;
        xml += `      <guid isPermaLink="true">${siteUrl}/blog/${post.id}</guid>\n`;
        xml += `    </item>\n`;
      }

      xml += `  </channel>\n`;
      xml += `</rss>`;

      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      res.send(xml);
    } catch (err) {
      console.error('[Server] RSS generation error:', err);
      res.status(500).type('text/plain').send('Error generating rss.xml');
    }
  });

  // Use Vite middlewares in dev mode for assets and HMR
  if (!isProd && vite) {
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));
  }

  // 4. Detailed Blog Post route (/blog/:id) with Full SSR Meta Pre-rendering & Real 404
  app.get('/blog/:id', async (req: Request, res: Response) => {
    const postId = req.params.id;
    const siteUrl = getBaseUrl(req);
    const post = await getPostById(postId);

    let template = '';
    const indexPath = isProd
      ? path.resolve(__dirname, 'dist', 'index.html')
      : path.resolve(__dirname, 'index.html');

    try {
      template = fs.readFileSync(indexPath, 'utf-8');
      if (!isProd && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }
    } catch (e) {
      console.error('[Server] Failed to read index.html:', e);
      return res.status(500).send('Server Error loading template');
    }

    // CASE A: Post does not exist or is private/deleted -> REAL HTTP 404
    if (!post) {
      const notFoundHead = `
    <title>글을 찾을 수 없습니다 | ${SITE_NAME}</title>
    <meta name="description" content="요청하신 게시글이 존재하지 않거나 삭제되었습니다." />
    <meta name="robots" content="noindex, follow" />
    <meta property="og:title" content="글을 찾을 수 없습니다 | ${SITE_NAME}" />
    <meta property="og:description" content="요청하신 게시글이 존재하지 않거나 삭제되었습니다." />
    <meta property="og:type" content="website" />
    <meta name="google-site-verification" content="" />
    <meta name="naver-site-verification" content="" />
      `.trim();

      const notFoundState = `
    <script>
      window.__INITIAL_POST__ = null;
      window.__INITIAL_POST_NOT_FOUND__ = true;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
      `.trim();

      let html = template;
      // Replace SSR_HEAD
      html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, notFoundHead);
      // Replace SSR_BODY_STATE
      html = html.replace(/<!-- SSR_BODY_STATE -->/, notFoundState);

      // Return Real HTTP 404 Status Code
      return res.status(404).send(html);
    }

    // CASE B: Post exists -> HTTP 200 with dynamic canonical, og:*, article:*, BlogPosting & BreadcrumbList JSON-LD
    const canonicalUrl = `${siteUrl}/blog/${post.id}`;
    const pageTitle = `${post.title} | ${SITE_NAME}`;
    const pageDescription = post.excerpt || post.subTitle || `${SITE_NAME} 프리미엄 에디토리얼 칼럼`;

    const blogPostingJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": pageDescription,
      "image": post.imageUrl,
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "author": {
        "@type": "Organization",
        "name": SITE_NAME
      },
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": siteUrl
      }
    };

    const breadcrumbJsonLd = {
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

    const postHead = `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:image" content="${escapeHtml(post.imageUrl)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="article:published_time" content="${post.createdAt}" />
    <meta property="article:modified_time" content="${post.updatedAt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(post.imageUrl)}" />
    <meta name="robots" content="index, follow" />
    <meta name="google-site-verification" content="" />
    <meta name="naver-site-verification" content="" />
    <script type="application/ld+json">
${JSON.stringify(blogPostingJsonLd, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(breadcrumbJsonLd, null, 2)}
    </script>
    `.trim();

    const postState = `
    <script>
      window.__INITIAL_POST__ = ${JSON.stringify(post)};
      window.__INITIAL_POST_NOT_FOUND__ = false;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
    `.trim();

    let html = template;
    html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, postHead);
    html = html.replace(/<!-- SSR_BODY_STATE -->/, postState);

    return res.status(200).send(html);
  });

  // 5. Catch-all route (Homepage and others)
  app.get('*', async (req: Request, res: Response) => {
    const siteUrl = getBaseUrl(req);
    const indexPath = isProd
      ? path.resolve(__dirname, 'dist', 'index.html')
      : path.resolve(__dirname, 'index.html');

    try {
      let template = fs.readFileSync(indexPath, 'utf-8');
      if (!isProd && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }

      const homeHead = `
    <title>${SITE_NAME} - 전문적인 내용과 지식을 담은 명품 웹진</title>
    <meta name="description" content="${SITE_NAME}은 전문적인 내용과 지식을 깊이 있게 전하는 프리미엄 명품 에디토리얼 웹진 서비스입니다." />
    <link rel="canonical" href="${siteUrl}" />
    <meta property="og:title" content="${SITE_NAME} - 전문적인 내용과 지식을 담은 명품 웹진" />
    <meta property="og:description" content="${SITE_NAME}은 전문적인 내용과 지식을 깊이 있게 전하는 프리미엄 명품 에디토리얼 웹진 서비스입니다." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${siteUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="robots" content="index, follow" />
    <meta name="last-modified" content="${new Date().toISOString()}" />
    <meta name="google-site-verification" content="" />
    <meta name="naver-site-verification" content="" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": "${SITE_NAME}",
      "url": "${siteUrl}",
      "description": "전문적인 내용과 지식을 깊이 있게 전하는 프리미엄 명품 에디토리얼 웹진 서비스",
      "dateModified": "${new Date().toISOString()}",
      "inLanguage": "ko-KR"
    }
    </script>
      `.trim();

      const homeState = `
    <script>
      window.__INITIAL_POST__ = null;
      window.__INITIAL_POST_NOT_FOUND__ = false;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
      `.trim();

      let html = template;
      html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, homeHead);
      html = html.replace(/<!-- SSR_BODY_STATE -->/, homeState);

      res.status(200).send(html);
    } catch (e) {
      console.error('[Server] Catch-all error:', e);
      res.status(500).send('Server Error');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ${SITE_NAME} listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal server startup error:', err);
  process.exit(1);
});
