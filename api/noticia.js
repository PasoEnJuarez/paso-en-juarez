import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const { id } = req.query;

  let title = "PasóEnJuárez | Periódico digital";
  let desc = "Entérate de lo más relevante en Ciudad Juárez.";
  let image = "https://www.pasoenjuarez.com/images/header-bg.jpg";
  let url = `https://www.pasoenjuarez.com/api/noticia?id=${id || ''}`;

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
          desc = nota.contenido.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
        }
        
        const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;
        if (textoImagenes) {
          let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
          listaFotos = listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);
          if (listaFotos.length > 0) {
            image = listaFotos[0];
          }
        }
      }
    } catch (err) {
      console.error("Error al buscar en Supabase:", err);
    }
  }

  const filePath = path.join(process.cwd(), 'noticia.html');
  let html = fs.readFileSync(filePath, 'utf8');

  html = html
    .replace('<title>Noticia | PasóEnJuárez</title>', `<title>${title}</title>`)
    .replace('content="PasóEnJuárez | Periódico digital"', `content="${title}"`)
    .replace('content="Entérate de lo más relevante en Ciudad Juárez."', `content="${desc}"`)
    .replace('content="https://www.pasoenjuarez.com/images/header-bg.jpg"', `content="${image}"`)
    .replace('content=""', `content="${url}"`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
