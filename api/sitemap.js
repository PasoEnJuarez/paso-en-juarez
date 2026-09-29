import { createClient } from '@supabase/supabase-js';

function generarSlug(texto) {
  if (!texto) return 'noticia';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default async function handler(req, res) {
  const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Consulta oficial con el SDK de Supabase
    let { data: noticias, error } = await supabase
      .from('Noticias')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !noticias || noticias.length === 0) {
      const resAlt = await supabase
        .from('noticias')
        .select('id, titulo, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      noticias = resAlt.data || [];
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Páginas estáticas principales
    const staticPages = [
      { url: 'https://www.pasoenjuarez.com/', changefreq: 'always', priority: '1.0' },
      { url: 'https://www.pasoenjuarez.com/contacto.html', changefreq: 'monthly', priority: '0.3' },
      { url: 'https://www.pasoenjuarez.com/politica-de-privacidad.html', changefreq: 'yearly', priority: '0.1' }
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Inyección de todas las noticias de Supabase
    if (Array.isArray(noticias) && noticias.length > 0) {
      noticias.forEach(noticia => {
        const slug = generarSlug(noticia.titulo);
        const lastMod = noticia.created_at ? new Date(noticia.created_at).toISOString().split('T')[0] : '';
        
        xml += '  <url>\n';
        xml += `    <loc>https://www.pasoenjuarez.com/noticia.html?id=${noticia.id}/${slug}</loc>\n`;
        if (lastMod) {
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
        }
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += '  </url>\n';
      });
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(xml);

  } catch (error) {
    let xmlError = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlError += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xmlError += '  <url><loc>https://www.pasoenjuarez.com/</loc></url>\n';
    xmlError += `  <!-- Error de compilación: ${error.message} -->\n`;
    xmlError += '</urlset>';
    
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(xmlError);
  }
}
