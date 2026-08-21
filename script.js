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

function inicializarPublicidad() {
  const laterales = document.querySelectorAll('.columna-publicidad');
  laterales.forEach((aside) => {
    const banner = aside.querySelector('.caja-banner-vertical');
    if (banner && typeof MIS_ANUNCIOS !== 'undefined' && MIS_ANUNCIOS.length > 0) {
      const anuncio = MIS_ANUNCIOS[Math.floor(Math.random() * MIS_ANUNCIOS.length)];
      banner.innerHTML = `<a href="${anuncio.link}" target="_blank"><img src="${anuncio.imagen}" style="width: 100%; border-radius: 8px;"></a>`;
    }
  });
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
  let galeriaHTML = listaFotos.length === 1 ? `<div style="text-align: center; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px;"><img src="${listaFotos[0]}" alt="${nota.titulo}" style="max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #334155;" loading="lazy"></div>` : (listaFotos.length > 1 ? `<div style="border-top: 1px solid #334155; padding-top: 15px; margin-top: 15px;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">${listaFotos.map(img => `<img src="${img}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;" loading="lazy">`).join('')}</div></div>` : '');
  const urlActual = window.encodeURIComponent(window.location.href);
  const textoCompartir = window.encodeURIComponent(`PasoEnJuarez: "${nota.titulo || 'Noticia'}"`);
  document.getElementById('modal-galeria').innerHTML = galeriaHTML + `<div style="margin-top: 25px; border-top: 1px solid #334155; padding-top: 15px; display: flex; gap: 10px;"><a href="https://api.whatsapp.com/send?text=${textoCompartir}%20${urlActual}" target="_blank" style="background: #25d366; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none;">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${urlActual}" target="_blank" style="background: #1877f2; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none;">Facebook</a></div>`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModalNoticia() {
  const modal = document.getElementById('modal-noticia');
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

async function cargarNoticiasEnVivo(categoria = 'todas', direccion = 0) {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  if (!supabaseClient) return;
  categoriaActual = categoria;
  paginaActual += direccion;
  if (paginaActual < 0) paginaActual = 0;
  const inicio = paginaActual * NOTICIAS_POR_PAGINA;
  const fin = inicio + NOTICIAS_POR_PAGINA - 1;
  try {
    let query = supabaseClient.from('Noticias').select('*').order('created_at', { ascending: false }).range(inicio, fin);
    if (categoria !== 'todas') query = query.ilike('categoria', `%${categoria.trim()}%`);
    let { data: noticias } = await query;
    listaNoticiasCargadas = noticias || [];
    if (contenedorNoticias) {
      contenedorNoticias.innerHTML = noticias.map(nota => {
        const galeriaHTML = obtenerListaFotos(nota).length > 0 ? `<img src="${obtenerListaFotos(nota)[0]}" loading="lazy">` : '';
        return `<article class="noticia" data-id="${nota.id}" style="cursor: pointer;"><h2>${nota.titulo}</h2>${galeriaHTML}<p>${nota.contenido?.substring(0, 140)}...</p></article>`;
      }).join('') + `
        <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; margin-top: 20px;">
          <button id="btn-Anterior" ${paginaActual === 0 ? 'disabled' : ''}>← Anterior</button>
          <span>Página ${paginaActual + 1}</span>
          <button id="btn-Siguiente">Siguiente →</button>
        </div>`;
      contenedorNoticias.querySelectorAll('.noticia').forEach(tarjeta => tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id'))));
      document.getElementById('btn-Siguiente').addEventListener('click', () => { cargarNoticiasEnVivo(categoriaActual, 1); window.scrollTo(0,0); });
      document.getElementById('btn-Anterior').addEventListener('click', () => { cargarNoticiasEnVivo(categoriaActual, -1); window.scrollTo(0,0); });
    }
    inicializarPublicidad();
  } catch (err) { console.error(err); }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarNoticiasEnVivo('todas', 0);
  document.getElementById('cerrar-modal')?.addEventListener('click', cerrarModalNoticia);
  document.querySelectorAll('#menu-navegacion .nav-btn').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); paginaActual = 0; cargarNoticiasEnVivo(btn.getAttribute('data-categoria'), 0); }));
});
