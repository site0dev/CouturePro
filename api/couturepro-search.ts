// Recherche publique avec plusieurs sources de secours.
type SearchResult = { title: string; url: string; snippet: string };

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeUrl(value: string): string {
  try {
    let url = decodeHtml(value).trim();
    const parsed = new URL(url, 'https://www.bing.com');
    const redirect = parsed.searchParams.get('uddg');
    if (redirect) url = redirect;
    const finalUrl = new URL(url);
    return ['http:', 'https:'].includes(finalUrl.protocol) ? finalUrl.href : '';
  } catch { return ''; }
}

function parseBingRss(xml: string): SearchResult[] {
  const results: SearchResult[] = [];
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const item of items) {
    const t = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const l = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const d = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    if (!t || !l) continue;
    const title = decodeHtml(t[1]), url = safeUrl(l[1]);
    const snippet = d ? decodeHtml(d[1]) : '';
    if (title && url && !results.some(x => x.url === url)) results.push({title,url,snippet});
    if (results.length >= 7) break;
  }
  return results;
}

function parseDuckDuckGo(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const blocks = html.split(/class=["'][^"']*result__body[^"']*["']/i).slice(1);
  for (const block of blocks) {
    const a = block.match(/<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!a) continue;
    const title = decodeHtml(a[2]), url = safeUrl(a[1]);
    const s = block.match(/class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div|span)>/i);
    const snippet = s ? decodeHtml(s[1]) : '';
    if (title && url && !results.some(x => x.url === url)) results.push({title,url,snippet});
    if (results.length >= 7) break;
  }
  return results;
}

async function request(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CoutureProSearch/1.0)',
      'Accept': accept,
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7'
    },
    signal: AbortSignal.timeout(9000),
    redirect: 'follow'
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({error:'Méthode non autorisée.'});

  const query = String(req.body?.query || '').trim();
  if (!query) return res.status(400).json({error:'Saisissez une question.'});
  if (query.length > 300) return res.status(400).json({error:'La recherche est trop longue (300 caractères maximum).'});

  const q = encodeURIComponent(query);
  const issues: string[] = [];

  // Bing RSS en premier.
  try {
    const r = await request(`https://www.bing.com/search?format=rss&q=${q}`, 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8');
    if (r.ok) {
      const results = parseBingRss(await r.text());
      if (results.length) return res.status(200).json({results});
      issues.push('Bing sans résultat exploitable');
    } else issues.push(`Bing HTTP ${r.status}`);
  } catch (e: any) {
    issues.push(`Bing ${e?.name === 'AbortError' ? 'délai dépassé' : 'indisponible'}`);
  }

  // DuckDuckGo en deuxième choix.
  try {
    const r = await request(`https://html.duckduckgo.com/html/?q=${q}`, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8');
    if (r.ok) {
      const results = parseDuckDuckGo(await r.text());
      if (results.length) return res.status(200).json({results});
      issues.push('DuckDuckGo sans résultat exploitable');
    } else issues.push(`DuckDuckGo HTTP ${r.status}`);
  } catch (e: any) {
    issues.push(`DuckDuckGo ${e?.name === 'AbortError' ? 'délai dépassé' : 'indisponible'}`);
  }

  console.error('Recherche publique indisponible:', issues.join(' | '));
  return res.status(503).json({error:'Les moteurs de recherche ne répondent pas pour le moment. Réessayez dans quelques instants.'});
}
