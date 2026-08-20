const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let listaNoticiasCargadas = [];

function obtenerListaFotos(nota) {
  const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;
  if (!textoImagenes) return [];
  let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
  return listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);
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
    galeriaHTML = `<div style="text-align: center; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px;"><img src="${listaFotos[0]}" alt="${nota.titulo}" style="max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #334155;"></div>`;
  } else if (listaFotos.length > 1) {
    galeriaHTML = `<div style="border-top: 1px solid #334155; padding-top: 15px; margin-top: 15px;"><small style="color: #94a3b8; display: block; margin-bottom: 8px; font-weight: bold;">Galeria:</small><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">${listaFotos.map(img => `<img src="${img}" alt="${nota.titulo}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;">`).join('')}</div></div>`;
  }

  const urlActual = window.encodeURIComponent(window.location.href);
  const textoCompartir = window.encodeURIComponent(`PasoEnJuarez: "${nota.titulo || 'Noticia'}"`);

  const compartirHTML = `<div style="margin-top: 25px; border-top: 1px solid #334155; padding-top: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;"><span style="color: #94a3b8; font-size: 0.85rem; font-weight: bold;">Compartir:</span><a href="https://api.whatsapp.com/send?text=${textoCompartir}%20${urlActual}" target="_blank" style="background: #25d366; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; text-decoration: none; font-weight: bold;">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${urlActual}" target="_blank" style="background: #1877f2; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; text-decoration: none; font-weight: bold;">Facebook</a></div>`;
  
  document.getElementById('modal-galeria').innerHTML = galeriaHTML + compartirHTML;
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

async function cargarNoticiasEnVivo(categoria = 'todas') {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  const carruselCronologico = document.getElementById('carrusel-cronologico');

  if (!supabaseClient) return;

  try {
    let { data: noticias, error } = await supabaseClient.from('Noticias').select('*').order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      const res = await supabaseClient.from('noticias').select('*').order('created_at', { ascending: false });
      noticias = res.data;
    }

    listaNoticiasCargadas = noticias || [];

    let noticiasFiltradas = listaNoticiasCargadas;
    if (categoria && categoria.toLowerCase() !== 'todas') {
      noticiasFiltradas = listaNoticiasCargadas.filter(n => n.categoria && n.categoria.toLowerCase().trim() === categoria.toLowerCase().trim());
    }

    if (!noticiasFiltradas || noticiasFiltradas.length === 0) {
      if (contenedorNoticias) {
        contenedorNoticias.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 25px; background: #ffffff; border-radius: 8px; color: #475569;"><p>No hay noticias en esta categoria.</p></div>`;
      }
      return;
    }

    if (contenedorNoticias) {
      contenedorNoticias.innerHTML = noticiasFiltradas.map(nota => {
        const listaFotos = obtenerListaFotos(nota);
        const galeriaHTML = listaFotos.length > 0 ? `<img src="${listaFotos[0]}" alt="${nota.titulo || 'Noticia'}">` : '';
        const resumen = nota.contenido && nota.contenido.length > 140 ? nota.contenido.substring(0, 140) + '...' : nota.contenido || '';
        const catClase = nota.categoria ? nota.categoria.toLowerCase().trim().replace(/\s+/g, '-') : 'general';

        return `<article class="noticia" data-id="${nota.id}" style="cursor: pointer;"><span class="categoria ${catClase}">${nota.categoria || 'General'}</span><h2>${nota.titulo || 'Sin título'}</h2>${galeriaHTML}<p>${resumen}</p><span style="color: #0284c7; font-size: 0.85rem; font-weight: bold; display: inline-block; margin-top: 8px;">Leer noticia completa →</span></article>`;
      }).join('');

      contenedorNoticias.querySelectorAll('.noticia').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id')));
      });
    }

    if (carruselCronologico) {
      carruselCronologico.innerHTML = listaNoticiasCargadas.map(nota => {
        const hora = nota.created_at ? new Date(nota.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        return `<div class="tarjeta-cronologica" data-id="${nota.id}" style="cursor: pointer;"><span class="hora">${hora}</span><h4>${nota.titulo || ''}</h4></div>`;
      }).join('');

      carruselCronologico.querySelectorAll('.tarjeta-cronologica').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id')));
      });
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarNoticiasEnVivo();

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
      cargarNoticiasEnVivo(btn.getAttribute('data-categoria'));
    });
  });
});
