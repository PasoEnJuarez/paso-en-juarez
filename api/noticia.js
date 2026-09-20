import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrd25tb3J5bWpodGhka2NlYnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTYwMTQsImV4cCI6MjEwMjU5MjAxNH0.bIwjqCL1ckId5hnGFPfropYBMrv92V7ecAYkGfe1QL8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const rawId = req.query.id;

  let title = "PasóEnJuárez | Periódico digital";
  let desc = "Entérate de lo más relevante en Ciudad Juárez.";
  let image = "https://www.pasoenjuarez.com/images/header-bg.jpg";
  let url = `https://www.pasoenjuarez.com/api/noticia?id=${rawId || ''}`;

  if (rawId) {
    const idMatch = String(rawId).match(/^(\d+)/);
    const id = idMatch ? idMatch[1] : null;

    if (id) {
      try {
        let { data: nota } = await supabase
          .from('Noticias')
          .select('*')
          .eq('id', id)
          .single();

        if (!nota) {
          const resAlt = await supabase.from('noticias').select('*').eq('id', id).single();
          nota = resAlt.data;
        }

        if (nota) {
          title = nota.titulo ? `${nota.titulo} | PasóEnJuárez` : title;
          if (nota.contenido) {
            desc = nota.contenido.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
          }
          
          // Buscar en todos los campos posibles donde guardes imágenes
          const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;
          if (textoImagenes) {
            // Limpia y separa por comas o saltos de línea por si hay varias
            let listaFotos = Array.isArray(textoImagenes) 
              ? textoImagenes 
              : String(textoImagenes).split(/[,\n]+/);

            listaFotos = listaFotos
              .map(img => String(img).replace(/\\/g, '/').trim())
              .filter(img => img.length > 0);

            // GARANTÍA: Si hay una o más fotos, toma EXCLUSIVAMENTE LA PRIMERA ([0])
            if (listaFotos.length > 0) {
              image = listaFotos[0].replace('https://akwnmorymjhthdkcebri.supabase.co', 'https://api.pasoenjuarez.com');
            }
          }
        }
      } catch (err) {
        console.error("Error al buscar en Supabase:", err);
      }
    }
  }

  try {
    const filePath = path.join(process.cwd(), 'noticia.html');
    let html = fs.readFileSync(filePath, 'utf8');

    html = html
      .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
      .replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${title}">`)
      .replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${desc}">`)
      .replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${image}">`)
      .replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${url}">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error("Error al leer noticia.html:", err);
    return res.redirect('/index.html');
  }
}
