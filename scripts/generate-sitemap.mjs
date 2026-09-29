import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(text) {
  return (text || 'noticia').toString().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim()
    .replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function buildSitemap() {
  console.log('Obteniendo noticias desde Supabase...');
  const { data: noticias, error } = await supabase
    .from('Noticias')
    .select('id, titulo, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al consultar Supabase:', error);
    process.exit(1);
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url><loc>https://www.pasoenjuarez.com/</loc><changefreq>always</changefreq><priority>1.0</priority></url>\n';
  xml += '  <url><loc>https://www.pasoenjuarez.com/contacto.html</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n';
  xml += '  <url><loc>https://www.pasoenjuarez.com/politica-de-privacidad.html</loc><changefreq>yearly</changefreq><priority>0.1</priority></url>\n';

  if (noticias) {
    noticias.forEach(n => {
      const slug = slugify(n.titulo);
      const date = n.created_at ? new Date(n.created_at).toISOString().split('T')[0] : '';
      xml += `  <url>\n    <loc>https://www.pasoenjuarez.com/noticia.html?id=${n.id}/${slug}</loc>\n`;
      if (date) xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
  }

  xml += '</urlset>';

  const outputPath = path.resolve('sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`¡Sitemap actualizado con éxito! Se incluyeron ${noticias ? noticias.length : 0} noticias.`);
}

buildSitemap();
