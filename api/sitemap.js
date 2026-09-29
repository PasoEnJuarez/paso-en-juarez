// Función auxiliar idéntica a la de tus otros scripts para generar slugs limpios
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

  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json'
    };

    // Petición idéntica a tus scripts para consultar la tabla Noticias en Supabase
    let response = await fetch(`${SUPABASE_URL}/rest/v1/Noticias?select=id,titulo,created_at&order=created_at.desc&limit=500`, { headers });

    if (!response.ok) {
      // Respaldo por seguridad en minúsculas
      response = await fetch(`${SUPABASE_URL}/rest/v1/noticias?select=id,titulo,created_at&order=created_at.desc&limit=500`, { headers });
    }

    const noticias = response.ok ? await response.json() : [];

    // Estructura XML del sitemap estándar
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Páginas estáticas principales de tu medio
    const staticPages = [
      { url: 'https://www.pasoenjuarez.com/', changefreq: 'always', priority: '1.0' },
      { url: 'https://www.pasoenjuarez.com/contacto.html', changefreq: 'monthly', priority: '0.3' },
      { url: 'https://www.pasoenjuarez.com/politica-de-privacidad.html', changefreq: 'yearly', priority: '0.1' }
    ];

    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Inyección dinámica de las noticias con el formato exacto de noticia.html
    if (Array.isArray(noticias) && noticias.length > 0) {
      noticias.forEach(noticia => {
        const slug = generarSlug(noticia.titulo);
        const lastMod = noticia.created_at ? new Date(noticia.created_at).toISOString().split('T')[0] : '';
        
        xml += `  <url>\n`;
        xml += `    <loc>https://www.pasoenjuarez.com/noticia.html?id=${noticia.id}/${slug}</loc>\n`;
        if (lastMod) xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;

    // Encabezados HTTP limpios para evitar problemas de caché temporal en Vercel
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(xml);

  } catch (error) {
    console.error("Error generando sitemap dinámico:", error);
    res.status(500).send('Error generando el sitemap dinámico');
  }
}
