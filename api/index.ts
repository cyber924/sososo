/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../src/lib/firebase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const SITE_NAME = '소소한 웹진';
const PRODUCTION_URL = 'https://sososo-three.vercel.app';

// Always use production URL in production / Vercel to maintain SEO consistency
function getBaseUrl(req: Request): string {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return PRODUCTION_URL;
  }
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host') || 'localhost:3000';
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

// Robust Firestore Timestamp / String / Date normalization
function formatIsoDate(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    // 1. If it is a Firestore Timestamp
    if (dateVal && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString();
    }
    // 2. If it is a raw Timestamp representation
    if (dateVal && typeof dateVal.seconds === 'number') {
      return new Date(dateVal.seconds * 1000).toISOString();
    }
    // 3. String or number/Date parse
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (e) {
    console.warn('[Server] Error normalizing date:', dateVal, e);
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
  // Directly retrieve from Firestore 'posts' collection
  const docRef = doc(db, 'posts', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    // Filter out draft, private, unpublished posts
    if (data.status === 'draft' || data.status === 'private' || data.isPublished === false) {
      return null;
    }

    // Filter out scheduled future posts
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

  return null;
}

async function getAllPublicPosts(): Promise<SanitizedPost[]> {
  const posts: SanitizedPost[] = [];
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Filter out draft, private, unpublished posts
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

  return posts;
}

// 1. Dynamic robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const siteUrl = getBaseUrl(req);
  res.type('text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

// 2. Dynamic sitemap.xml with real lastmod and safe escaping & encoding
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
      const safeId = encodeURIComponent(post.id);
      const safeLoc = escapeXml(`${siteUrl}/blog/${safeId}`);
      xml += `  <url>\n`;
      xml += `    <loc>${safeLoc}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.send(xml);
  } catch (err: any) {
    console.error('[Server] Sitemap generation error:', err);
    res.status(500).type('text/plain').send(`Error generating sitemap.xml: ${err.message || err}`);
  }
});

// 3. Dynamic RSS 2.0 Feed
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
      const safeId = encodeURIComponent(post.id);
      xml += `    <item>\n`;
      xml += `      <title><![CDATA[${post.title}]]></title>\n`;
      xml += `      <link>${siteUrl}/blog/${safeId}</link>\n`;
      xml += `      <description><![CDATA[${post.excerpt}]]></description>\n`;
      xml += `      <author>sungbae0613@gmail.com (${escapeXml(post.author)})</author>\n`;
      xml += `      <category>${escapeXml(post.category)}</category>\n`;
      xml += `      <pubDate>${pubDate}</pubDate>\n`;
      xml += `      <guid isPermaLink="true">${siteUrl}/blog/${safeId}</guid>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.send(xml);
  } catch (err: any) {
    console.error('[Server] RSS generation error:', err);
    res.status(500).type('text/plain').send(`Error generating rss.xml: ${err.message || err}`);
  }
});

// Dynamic Vite handler loading ONLY in non-production/non-Vercel environment
let vite: any;
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

if (!isProd) {
  // Load Vite dynamically to keep production serverless runtime completely independent of Vite
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((v) => {
      vite = v;
      app.use(vite.middlewares);
    });
  }).catch((err) => {
    console.error('Failed to load Vite dynamically:', err);
  });
} else {
  // Locate static dist folder
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath, { index: false }));
}

// 4. Detailed Blog Post route with Full SSR Meta Pre-rendering & Real 404
app.get('/blog/:id', async (req: Request, res: Response) => {
  const postId = req.params.id;
  const siteUrl = getBaseUrl(req);

  try {
    const post = await getPostById(postId);

    let template = '';
    const indexPath = isProd
      ? path.resolve(process.cwd(), 'dist', 'index.html')
      : path.resolve(process.cwd(), 'index.html');

    try {
      template = fs.readFileSync(indexPath, 'utf-8');
      if (!isProd && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }
    } catch (e: any) {
      console.error('[Server] Failed to read index.html template:', e);
      return res.status(500).send('Server Error loading template');
    }

    // Case A: Post not found
    if (!post) {
      const notFoundHead = `
    <title>글을 찾을 수 없습니다 | ${SITE_NAME}</title>
    <meta name="description" content="요청하신 게시글이 존재하지 않거나 삭제되었습니다." />
    <meta name="robots" content="noindex, follow" />
    <meta property="og:title" content="글을 찾을 수 없습니다 | ${SITE_NAME}" />
    <meta property="og:description" content="요청하신 게시글이 존재하지 않거나 삭제되었습니다." />
    <meta property="og:type" content="website" />
      `.trim();

      const notFoundState = `
    <script>
      window.__INITIAL_POST__ = null;
      window.__INITIAL_POST_NOT_FOUND__ = true;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
      `.trim();

      let html = template;
      html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, notFoundHead);
      html = html.replace(/<!-- SSR_BODY_STATE -->/, notFoundState);

      return res.status(404).send(html);
    }

    // Case B: Post found
    const safeId = encodeURIComponent(post.id);
    const canonicalUrl = `${siteUrl}/blog/${safeId}`;
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
  } catch (err: any) {
    console.error('[Server] Blog page pre-render error:', err);
    res.status(500).type('text/plain').send(`Error loading blog page: ${err.message || err}`);
  }
});

// 5. Catch-all route (Homepage and others)
app.get('*', async (req: Request, res: Response) => {
  const siteUrl = getBaseUrl(req);
  const indexPath = isProd
    ? path.resolve(process.cwd(), 'dist', 'index.html')
    : path.resolve(process.cwd(), 'index.html');

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
  } catch (e: any) {
    console.error('[Server] Catch-all error:', e);
    res.status(500).send('Server Error loading homepage');
  }
});

export default app;
