/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Server reads use Firestore HTTPS directly: no browser TypeScript imports,
// gRPC transport, service-account credentials, or offline cache fallback.
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/weather-49c44/databases/ai-studio-aiwebzineblog-dadec710-29d0-43c4-a8a2-3bed7e263772/documents';

function decodeValue(value: any): any {
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
function decodeFields(fields: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}
async function firestoreRequest(url: string, body?: any): Promise<any> {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore HTTP ${response.status}`);
  return response.json();
}

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

// Never invent modification dates; omit lastmod if the source has no valid date.
function formatIsoDate(value?: any): string {
  try {
    if (value?.toDate) value = value.toDate();
    else if (typeof value?.seconds === 'number') value = value.seconds * 1000;
    if (value === undefined || value === null || value === '') return '';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : '';
  } catch { return ''; }
}
function isPublicPost(data: any): boolean {
  // Legacy central-hub posts have no publication flags and are already public.
  if (data.status && !['published', 'public'].includes(data.status)) return false;
  if (data.isPublished === false || data.visibility === 'private' || data.visibility === 'draft') return false;
  const date = data.publishAt ?? data.publishedAt ?? data.createdAt;
  const iso = formatIsoDate(date);
  if (date && !iso) return false;
  return !iso || new Date(iso).getTime() <= Date.now();
}
interface SanitizedPost {
  id: string; title: string; subTitle?: string; excerpt: string; content: string;
  category: string; imageUrl: string; author: string; createdAt: string;
  updatedAt: string; readTime: string; featured: boolean; views: number; tags: string[];
}
function sanitizePost(document: any): SanitizedPost | null {
  const data = decodeFields(document.fields || {});
  if (!isPublicPost(data) || typeof data.title !== 'string' || !data.title.trim()) return null;
  const categoryMap: Record<string, string> = { '기술/IT': 'IT', '경제/금융': '경제', '연예/드라마': '드라마', '사회/문화': '사회' };
  const content = typeof data.content === 'string' ? data.content : '';
  return {
    id: document.name.split('/').pop(), title: data.title,
    subTitle: data.subtitle || data.subTitle || undefined,
    excerpt: data.summary || data.excerpt || '소소한 웹진 에디토리얼 칼럼',
    content, category: categoryMap[data.category] || data.category || 'IT',
    imageUrl: data.coverImage || data.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    author: typeof data.author === 'string' ? data.author : data.author?.displayName || SITE_NAME,
    createdAt: formatIsoDate(data.publishedAt || data.publishAt || data.createdAt),
    updatedAt: formatIsoDate(data.updatedAt || data.modifiedAt || data.publishedAt || data.publishAt || data.createdAt),
    readTime: `${Math.max(1, Math.round(content.replace(/<[^>]*>/g, '').length / 450))} min read`,
    featured: Boolean(data.featured), views: Number(data.views) || 0,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };
}
async function getPostById(id: string): Promise<SanitizedPost | null> {
  const document = await firestoreRequest(`${FIRESTORE_URL}/posts/${encodeURIComponent(id)}`);
  return document ? sanitizePost(document) : null;
}
let cachedPosts: SanitizedPost[] | null = null;
let cachedAt = 0;
let pendingPosts: Promise<SanitizedPost[]> | null = null;
async function getAllPublicPosts(): Promise<SanitizedPost[]> {
  if (cachedPosts && Date.now() - cachedAt < 60000) return cachedPosts;
  if (!pendingPosts) {
    pendingPosts = (async () => {
      const rows = await firestoreRequest(`${FIRESTORE_URL}:runQuery`, { structuredQuery: {
        from: [{ collectionId: 'posts' }],
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      }});
      cachedPosts = rows.filter((row: any) => row.document).map((row: any) => sanitizePost(row.document)).filter(Boolean);
      cachedAt = Date.now();
      return cachedPosts!;
    })().finally(() => { pendingPosts = null; });
  }
  return pendingPosts;
}
function safeJson(value: any): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
function renderArticle(post: SanitizedPost, siteUrl: string): string {
  // Keep source content as text here; React renders the designed view afterwards.
  // Escaping prevents stored HTML/scripts from executing in the server preview.
  const paragraphs = post.content.replace(/<[^>]*>/g, '').split(/\n+/).filter(Boolean)
    .map(text => `<p>${escapeHtml(text)}</p>`).join('');
  return `<article><a href="${siteUrl}/">${SITE_NAME}</a><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="max-width:100%">${paragraphs}</article>`;
}
function renderPostLinks(posts: SanitizedPost[], siteUrl: string): string {
  return `<main><h1>${SITE_NAME}</h1><ul>${posts.map(post => `<li><a href="${siteUrl}/blog/${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a><p>${escapeHtml(post.excerpt)}</p></li>`).join('')}</ul></main>`;
}
app.get('/api/posts', async (_req, res) => {
  try { res.set('Cache-Control', 'public, max-age=60, s-maxage=60').json(await getAllPublicPosts()); }
  catch (error) { console.error('[Server] Public posts unavailable:', error); res.status(503).set('Cache-Control', 'no-store').json({ error: 'Public posts temporarily unavailable' }); }
});

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

    const latestSiteMod = posts.map(post => post.updatedAt).filter(Boolean).sort().at(-1);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Main Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(siteUrl + "/")}</loc>\n`;
    if (latestSiteMod) xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Public Blog Posts
    for (const post of posts) {
      const safeId = encodeURIComponent(post.id);
      const safeLoc = escapeXml(`${siteUrl}/blog/${safeId}`);
      xml += `  <url>\n`;
      xml += `    <loc>${safeLoc}</loc>\n`;
      if (post.updatedAt) xml += `    <lastmod>${post.updatedAt}</lastmod>\n`;
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
    res.status(503).set('Cache-Control', 'no-store').type('text/plain').send('Sitemap temporarily unavailable');
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

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const templatePath = isProd ? path.resolve(process.cwd(), 'dist/index.html') : path.resolve(process.cwd(), 'index.html');
app.use(express.static(path.resolve(process.cwd(), 'dist'), { index: false }));

// 4. Detailed Blog Post route with Full SSR Meta Pre-rendering & Real 404
app.get('/blog/:id', async (req: Request, res: Response) => {
  const postId = req.params.id;
  const siteUrl = getBaseUrl(req);

  try {
    const post = await getPostById(postId);

    let template = '';
    const indexPath = templatePath;

    try {
      template = fs.readFileSync(indexPath, 'utf-8');
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
      ...(post.createdAt ? { datePublished: post.createdAt } : {}),
      ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
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
${safeJson(blogPostingJsonLd)}
    </script>
    <script type="application/ld+json">
${safeJson(breadcrumbJsonLd)}
    </script>
    `.trim();

    const postState = `
    <script>
      window.__INITIAL_POST__ = ${safeJson(post)};
      window.__INITIAL_POST_NOT_FOUND__ = false;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
    `.trim();

    let html = template;
    html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, postHead);
    html = html.replace(/<!-- SSR_BODY_STATE -->/, postState);
    html = html.replace('<div id="root"></div>', `<div id="root">${renderArticle(post, siteUrl)}</div>`);

    return res.status(200).send(html);
  } catch (err: any) {
    console.error('[Server] Blog page pre-render error:', err);
    res.status(503).set('Cache-Control', 'no-store').type('text/plain').send('Article temporarily unavailable');
  }
});

// 5. Catch-all route (Homepage and others)
app.get('*', async (req: Request, res: Response) => {
  if (!['/', '/blog', '/api/index'].includes(req.path)) {
    return res.status(404).set('X-Robots-Tag', 'noindex').send('Page not found');
  }
  const siteUrl = getBaseUrl(req);
  const indexPath = templatePath;

  try {
    let template = fs.readFileSync(indexPath, 'utf-8');

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
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": "${SITE_NAME}",
      "url": "${siteUrl}",
      "description": "전문적인 내용과 지식을 깊이 있게 전하는 프리미엄 명품 에디토리얼 웹진 서비스",
      "inLanguage": "ko-KR"
    }
    </script>
    `.trim();

    const posts = await getAllPublicPosts();
    const homeState = `
    <script>
      window.__INITIAL_POST__ = null;
      window.__INITIAL_POSTS__ = ${safeJson(posts)};
      window.__INITIAL_POST_NOT_FOUND__ = false;
      window.__INITIAL_SITE_URL__ = ${JSON.stringify(siteUrl)};
    </script>
    `.trim();

    let html = template;
    html = html.replace(/<!-- SSR_HEAD_START -->[\s\S]*?<!-- SSR_HEAD_END -->/, homeHead);
    html = html.replace(/<!-- SSR_BODY_STATE -->/, homeState);
    html = html.replace('<div id="root"></div>', `<div id="root">${renderPostLinks(posts, siteUrl)}</div>`);

    res.status(200).send(html);
  } catch (e: any) {
    console.error('[Server] Catch-all error:', e);
    res.status(500).send('Server Error loading homepage');
  }
});

export default app;
