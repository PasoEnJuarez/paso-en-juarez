const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let listaNoticiasCargadas = [];
let paginaActual = 0;
const NOTICIAS_POR_PAGINA = 15;
let categoriaActual = 'todas';

function obtenerListaFotos(nota) {
  const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;
  if (!textoImagenes) return [];
  let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
  return listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);
}

// Función para generar reproductor de video (YouTube / Facebook)
function generarReproductorVideo(videoUrl) {
  if (!videoUrl) return '';
  const urlTrim = videoUrl.trim();
  
  if (urlTrim.includes('youtube.com') || urlTrim.includes('youtu.be')) {
    let videoId = '';
    if (urlTrim.includes('youtu.be/')) {
      videoId = urlTrim.split('youtu.be/')[1]?.split('?')[0];
    } else if (urlTrim.includes('watch?v=')) {
      videoId = urlTrim.split('watch?v=')[1]?.split('&')[0];
    } else if (urlTrim.includes('embed/')) {
      videoId = urlTrim.split('embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      return `
        <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
          <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
        </div>`;
    }
  }
  
  if (urlTrim.includes('facebook.com') || urlTrim.includes('fb.watch')) {
    return `
      <div style="margin-top: 15px; text-align: center; border-radius: 8px; overflow: hidden; border: 1px solid #334155; background: #0f172a; padding: 12px;">
        <p style="font-size: 0.8rem; color: #38bdf8; margin-bottom: 8px; font-weight: bold;">Video vinculado de Facebook:</p>
        <a href="${urlTrim}" target="_blank" style="display: inline-block; background: #1877f2; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: bold;">Ver video en Facebook →</a>
      </div>`;
  }

  return '';
}

// Función para inyectar anuncios dinámicamente desde la tabla Anuncios de Supabase
async function inicializarPublicidad() {
  const espacios = document.querySelectorAll('.caja-banner-vertical');
  if (!supabaseClient) return;

  try {
    const { data: anuncios, error } = await supabaseClient.from('Anuncios').select('*');
    if (error || !anuncios) return;

    espacios.forEach((contenedor, index) => {
      const anuncio = anuncios.find(a => Number(a.posicion) === index);
      
      if (anuncio) {
        contenedor.innerHTML = `
          <a href="${anuncio.link}" target="_blank" style="width:100%; height:100%; display:block;">
            <img src="${anuncio.imagen}" alt="${anuncio.nombre || 'Anuncio'}" style="width:100%; height:100%; object-fit:cover;">
          </a>`;
      }
    });
  } catch (err) {
    console.error("Error al cargar publicidad:", err);
  }
}

function abrirModalNoticia(idNota) {
  const nota = listaNoticiasCargadas.find(n => String(n.id) === String(idNota));
  if (!nota) return;

  const modal = document.getElementById('modal-noticia');
  document.getElementById('modal-categoria').textContent = nota.categoria || 'General';
  document.getElementById('modal-fecha').textContent = nota.created_at ? new Date(nota.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }) : '';
  document.getElementById('modal-titulo').textContent = nota.titulo || 'Sin título';
  document.getElementById('modal-contenido').textContent = nota.contenido || '';

  const listaFotos = obtenerListaFotos(nota);
  let galeriaHTML = '';

  if (listaFotos.length === 1) {
    galeriaHTML = `<div style="text-align: center; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px;"><img src="${listaFotos[0]}" alt="${nota.titulo}" style="max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #334155;" loading="lazy"></div>`;
  } else if (listaFotos.length > 1) {
    galeriaHTML = `<div style="border-top: 1px solid #334155; padding-top: 15px; margin-top: 15px;"><small style="color: #94a3b8; display: block; margin-bottom: 8px; font-weight: bold;">Galería:</small><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">${listaFotos.map(img => `<img src="${img}" alt="${nota.titulo}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;" loading="lazy">`).join('')}</div></div>`;
  }

  const videoHTML = generarReproductorVideo(nota.video_url);

  const urlActual = window.encodeURIComponent(window.location.href);
  const textoCompartir = window.encodeURIComponent(`PasóEnJuárez: "${nota.titulo || 'Noticia'}"`);
  const compartirHTML = `<div style="margin-top: 25px; border-top: 1px solid #334155; padding-top: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;"><span style="color: #94a3b8; font-size: 0.85rem; font-weight: bold;">Compartir:</span><a href="https://api.whatsapp.com/send?text=${textoCompartir}%20${urlActual}" target="_blank" style="background: #25d366; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; text-decoration: none; font-weight: bold;">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${urlActual}" target="_blank" style="background: #1877f2; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; text-decoration: none; font-weight: bold;">Facebook</a></div>`;
  
  document.getElementById('modal-galeria').innerHTML = videoHTML + galeriaHTML + compartirHTML;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModalNoticia() {
  const modal = document.getElementById('modal-noticia');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

async function cargarNoticiasEnVivo(categoria = 'todas', direccion = 0) {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  const carruselCronologico = document.getElementById('carrusel-cronologico');

  if (!supabaseClient) return;

  // Indicador de carga visual (Spinner)
  if (contenedorNoticias) {
    contenedorNoticias.innerHTML = `
      <div style="grid-column: span 2; text-align: center; padding: 50px; color: #64748b;">
        <div class="spinner-carga"></div>
        <p style="margin-top: 12px; font-size: 0.95rem; font-weight: 600;">Cargando información...</p>
      </div>`;
  }

  categoriaActual = categoria;
  paginaActual += direccion;
  if (paginaActual < 0) paginaActual = 0;

  const inicio = paginaActual * NOTICIAS_POR_PAGINA;
  const fin = inicio + NOTICIAS_POR_PAGINA - 1;

  try {
    let query = supabaseClient
      .from('Noticias')
      .select('*')
      .order('created_at', { ascending: false })
      .range(inicio, fin);

    if (categoria && categoria.toLowerCase() !== 'todas') {
      query = query.ilike('categoria', `%${categoria.trim()}%`);
    }

    let { data: noticias, error } = await query;

    if (error && error.code === '42P01') {
      let queryAlt = supabaseClient
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false })
        .range(inicio, fin);

      if (categoria && categoria.toLowerCase() !== 'todas') {
        queryAlt = queryAlt.ilike('categoria', `%${categoria.trim()}%`);
      }
      const res = await queryAlt;
      noticias = res.data;
    }

    listaNoticiasCargadas = noticias || [];

    if (!noticias || noticias.length === 0) {
      if (paginaActual > 0) {
        paginaActual--; 
      }
      if (contenedorNoticias && paginaActual === 0) {
        contenedorNoticias.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 25px; background: #ffffff; border-radius: 8px; color: #475569;"><p>No hay noticias en esta categoría.</p></div>`;
      }
      return;
    }

    if (contenedorNoticias) {
      let htmlNoticias = noticias.map(nota => {
        const listaFotos = obtenerListaFotos(nota);
        const galeriaHTML = listaFotos.length > 0 ? `<img src="${listaFotos[0]}" alt="${nota.titulo || 'Noticia'}" loading="lazy">` : '';
        const resumen = nota.contenido && nota.contenido.length > 140 ? nota.contenido.substring(0, 140) + '...' : nota.contenido || '';
        const catClase = nota.categoria ? nota.categoria.toLowerCase().trim().replace(/\s+/g, '-') : 'general';

        return `<article class="noticia" data-id="${nota.id}" style="cursor: pointer;"><span class="categoria ${catClase}">${nota.categoria || 'General'}</span><h2>${nota.titulo || 'Sin título'}</h2>${galeriaHTML}<p>${resumen}</p><span style="color: #0284c7; font-size: 0.85rem; font-weight: bold; display: inline-block; margin-top: 8px;">Leer noticia completa →</span></article>`;
      }).join('');

      const botonesPaginacion = `
        <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 10px 0;">
          <button id="btn-Anterior" ${paginaActual === 0 ? 'style="opacity: 0.5; pointer-events: none; background: #cbd5e1; color: #64748b; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;"' : 'style="background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;"'}>← Página Anterior</button>
          <span style="font-size: 0.9rem; color: #64748b; font-weight: bold;">Página ${paginaActual + 1}</span>
          <button id="btn-Siguiente" style="background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Página Siguiente →</button>
        </div>
      `;

      contenedorNoticias.innerHTML = htmlNoticias + botonesPaginacion;

      contenedorNoticias.querySelectorAll('.noticia').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id')));
      });

      document.getElementById('btn-Siguiente')?.addEventListener('click', () => {
        cargarNoticiasEnVivo(categoriaActual, 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      document.getElementById('btn-Anterior')?.addEventListener('click', () => {
        cargarNoticiasEnVivo(categoriaActual, -1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (carruselCronologico) {
      carruselCronologico.innerHTML = noticias.map(nota => {
        const hora = nota.created_at ? new Date(nota.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        return `<div class="tarjeta-cronologica" data-id="${nota.id}" style="cursor: pointer;"><span class="hora">${hora}</span><h4>${nota.titulo || ''}</h4></div>`;
      }).join('');

      carruselCronologico.querySelectorAll('.tarjeta-cronologica').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id')));
      });
    }

    inicializarPublicidad();

  } catch (err) {
    console.error("Error:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarNoticiasEnVivo('todas', 0);
  inicializarPublicidad();

  document.getElementById('cerrar-modal')?.addEventListener('click', cerrarModalNoticia);
  document.getElementById('modal-noticia')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalNoticia();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModalNoticia(); });

  document.querySelectorAll('#menu-navegacion .nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      paginaActual = 0;
      cargarNoticiasEnVivo(btn.getAttribute('data-categoria'), 0);
    });
  });
});
