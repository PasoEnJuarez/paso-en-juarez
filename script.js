const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrd25tb3J5bWpodGhka2NlYnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODtokMTYwMTQsImV4cCI6MjEwMjU5MjAxNH0.bIwjqCL1ckId5hnGFPfropYBMrv92V7ecAYkGfe1QL8';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let listaNoticiasCargadas = [];
let paginaActual = 0;
const NOTICIAS_POR_PAGINA = 10;
let categoriaActual = 'todas';

function obtenerListaFotos(nota) {
  const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;
  if (!textoImagenes) return [];
  let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
  return listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);
}

function obtenerYouTubeId(videoUrl) {
  if (!videoUrl) return '';
  const urlTrim = videoUrl.trim();
  let videoId = '';
  if (urlTrim.includes('youtu.be/')) {
    videoId = urlTrim.split('youtu.be/')[1]?.split('?')[0];
  } else if (urlTrim.includes('watch?v=')) {
    videoId = urlTrim.split('watch?v=')[1]?.split('&')[0];
  } else if (urlTrim.includes('embed/')) {
    videoId = urlTrim.split('embed/')[1]?.split('?')[0];
  }
  return videoId;
}

async function inicializarPublicidad() {
  if (!supabaseClient) return;

  try {
    const { data: anuncios, error } = await supabaseClient.from('Anuncios').select('*');
    if (error || !anuncios) return;

    const espaciosEscritorio = document.querySelectorAll('.columna-publicidad .caja-banner-vertical');
    espaciosEscritorio.forEach((contenedor, index) => {
      const anuncio = anuncios.find(a => Number(a.posicion) === index);
      const foto = anuncio ? (anuncio.imagen_desktop || anuncio.imagen) : null;
      
      if (anuncio && foto) {
        contenedor.innerHTML = `
          <a href="${anuncio.link || '#'}" target="_blank" style="width:100%; height:100%; display:block;">
            <img src="${foto}" alt="${anuncio.nombre || 'Anuncio'}" style="width:100%; height:100%; object-fit:cover;">
          </a>`;
      }
    });

    const espaciosMovil = document.querySelectorAll('.caja-banner-movil');
    espaciosMovil.forEach((contenedor) => {
      const indexStr = contenedor.getAttribute('data-posicion-anuncio');
      if (indexStr !== null) {
        const index = Number(indexStr);
        const anuncio = anuncios.find(a => Number(a.posicion) === index);
        const fotoMovil = anuncio ? (anuncio.imagen_movil || anuncio.imagen) : null;

        if (anuncio && fotoMovil) {
          contenedor.innerHTML = `
            <a href="${anuncio.link || '#'}" target="_blank" style="width:100%; height:100%; display:block;">
              <img src="${fotoMovil}" alt="${anuncio.nombre || 'Anuncio Móvil'}" style="width:100%; height:100%; object-fit:contain;">
            </a>`;
        }
      }
    });

  } catch (err) {
    console.error("Error al cargar publicidad:", err);
  }
}

async function inicializarWidgetsGlobales() {
  const elFecha = document.getElementById('widget-fecha');
  if (elFecha) {
    const opciones = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const fechaTexto = new Date().toLocaleDateString('es-MX', opciones);
    elFecha.innerHTML = `📅 ${fechaTexto}`;
  }

  const elClimaPrincipal = document.getElementById('clima-principal');
  const elClimaDetalles = document.getElementById('clima-detalles');
  
  if (elClimaPrincipal && elClimaDetalles) {
    try {
      const resClima = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.6904&longitude=-106.4245&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code');
      const dataClima = await resClima.json();
      
      if (dataClima && dataClima.current) {
        const temp = Math.round(dataClima.current.temperature_2m);
        const sensacion = Math.round(dataClima.current.apparent_temperature);
        const humedad = dataClima.current.relative_humidity_2m;
        
        const codigo = dataClima.current.weather_code;
        let condicion = "Despejado";
        if (codigo > 0 && codigo <= 3) condicion = "Parcialmente nublado";
        else if (codigo >= 45 && codigo <= 48) condicion = "Neblina";
        else if (codigo >= 51 && codigo <= 67) condicion = "Lluvia";
        else if (codigo >= 71 && codigo <= 77) condicion = "Nieve";
        else if (codigo >= 95) condicion = "Tormenta";

        elClimaPrincipal.innerText = `Juárez: ${temp}°C - ${condicion}`;
        elClimaDetalles.innerText = `Sensación: ${sensacion}°C | Humedad: ${humedad}%`;
      }
    } catch (e) {
      elClimaPrincipal.innerText = `Juárez: N/D`;
      elClimaDetalles.innerText = `No disponible`;
    }
  }

  const elDolar = document.getElementById('widget-dolar');
  if (elDolar) {
    try {
      const resDolar = await fetch('https://open.er-api.com/v6/latest/USD');
      const dataDolar = await resDolar.json();
      if (dataDolar && dataDolar.rates && dataDolar.rates.MXN) {
        const mxn = dataDolar.rates.MXN.toFixed(2);
        elDolar.innerHTML = `💵 Dólar: <strong>$${mxn} MXN</strong>`;
      }
    } catch (e) {
      elDolar.innerHTML = `💵 Dólar: N/D`;
    }
  }
}

function abrirModalNoticia(idNota) {
  window.location.href = `/api/noticia?id=${idNota}`;
}

function renderizarListaNoticias(noticiasAMostrar, contenedor, esResultadoBusqueda = false) {
  let htmlNoticias = noticiasAMostrar.map(nota => {
    const listaFotos = obtenerListaFotos(nota);
    let mediaHTML = '';

    if (listaFotos.length > 0) {
      if (listaFotos.length === 1) {
        mediaHTML = `<img src="${listaFotos[0]}" alt="${nota.titulo || 'Noticia'}" loading="lazy">`;
      } else {
        let miniaturasHTML = listaFotos.slice(0, 3).map((foto, index) => `
          <div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
            <img src="${foto}" alt="Foto ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            ${index === 2 && listaFotos.length > 3 ? `
              <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem;">
                +${listaFotos.length - 3}
              </div>` : ''}
          </div>
        `).join('');

        mediaHTML = `
          <div style="display: grid; grid-template-columns: repeat(${Math.min(listaFotos.length, 3)}, 1fr); gap: 4px; height: 180px; border-radius: 4px; overflow: hidden; background: #000;">
            ${miniaturasHTML}
          </div>`;
      }
    } else {
      const ytId = obtenerYouTubeId(nota.video_url);
      if (ytId) {
        const miniaturaYt = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        mediaHTML = `
          <div style="position: relative; width: 100%; height: 180px; background: #000; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="${miniaturaYt}" alt="${nota.titulo || 'Video'}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" loading="lazy">
            <div style="position: absolute; background: rgba(0,0,0,0.6); color: white; padding: 8px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.3);">
              ▶ Ver Video
            </div>
          </div>`;
      } else if (nota.video_url && nota.video_url.includes('facebook')) {
        mediaHTML = `
          <div style="width: 100%; height: 100px; background: #1e293b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #38bdf8; font-weight: bold; font-size: 0.9rem; border: 1px dashed #334155;">
            📹 Video de Facebook disponible
          </div>`;
      }
    }

    const resumen = nota.contenido && nota.contenido.length > 140 ? nota.contenido.substring(0, 140) + '...' : nota.contenido || '';
    const catClase = nota.categoria ? nota.categoria.toLowerCase().trim().replace(/\s+/g, '-') : 'general';

    return `
      <article class="noticia" data-id="${nota.id}" style="cursor: pointer;">
        <span class="categoria ${catClase}">${nota.categoria || 'General'}</span>
        <h2>${nota.titulo || 'Sin título'}</h2>
        ${mediaHTML}
        <p>${resumen}</p>
        <span style="color: #0284c7; font-size: 0.85rem; font-weight: bold; display: inline-block; margin-top: 8px;">Leer noticia completa →</span>
      </article>`;
  }).join('');

  let botonesPaginacion = '';
  if (!esResultadoBusqueda) {
    botonesPaginacion = `
      <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 10px 0;">
        <button id="btn-Anterior" ${paginaActual === 0 ? 'style="opacity: 0.5; pointer-events: none; background: #cbd5e1; color: #64748b; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;"' : 'style="background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;"'}>← Página Anterior</button>
        <span style="font-size: 0.9rem; color: #64748b; font-weight: bold;">Página ${paginaActual + 1}</span>
        <button id="btn-Siguiente" style="background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Página Siguiente →</button>
      </div>
    `;
  }

  contenedor.innerHTML = htmlNoticias + botonesPaginacion;

  contenedor.querySelectorAll('.noticia').forEach(tarjeta => {
    tarjeta.addEventListener('click', () => abrirModalNoticia(tarjeta.getAttribute('data-id')));
  });

  if (!esResultadoBusqueda) {
    document.getElementById('btn-Siguiente')?.addEventListener('click', () => {
      cargarNoticiasEnVivo(categoriaActual, 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-Anterior')?.addEventListener('click', () => {
      cargarNoticiasEnVivo(categoriaActual, -1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

async function cargarNoticiasEnVivo(categoria = 'todas', direccion = 0) {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  const carruselCronologico = document.getElementById('carrusel-cronologico');

  if (!supabaseClient) return;

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
      .from('Noticias') // <-- CORREGIDO AQUÍ ('Noticias' con N mayúscula)
      .select('*')
      .order('created_at', { ascending: false })
      .range(inicio, fin);

    if (categoria && categoria.toLowerCase() !== 'todas') {
      query = query.ilike('categoria', `%${categoria.trim()}%`);
    }

    let { data: noticias, error } = await query;

    if (error) {
      console.error("Error al cargar noticias:", error);
    }

    listaNoticiasCargadas = noticias || [];

    if (!noticias || noticias.length === 0) {
      if (paginaActual > 0) {
        paginaActual--; 
      }
      if (contenedorNoticias && paginaActual === 0) {
        contenedorNoticias.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 25px; background: #0f172a; border-radius: 8px; color: #94a3b8; border: 1px solid #1e293b;"><p>No hay noticias en esta categoría.</p></div>`;
      }
      if (carruselCronologico) {
        carruselCronologico.innerHTML = `<p style="color: #94a3b8; padding: 10px;">No hay cronología disponible.</p>`;
      }
      return;
    }

    if (contenedorNoticias) {
      renderizarListaNoticias(listaNoticiasCargadas, contenedorNoticias, false);
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
    console.error("Error general:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarNoticiasEnVivo('todas', 0);
  inicializarPublicidad();
  inicializarWidgetsGlobales();

  const btnMenuPuentes = document.getElementById('btn-menu-puentes');
  const dropdownPuentes = document.getElementById('dropdown-puentes');

  if (btnMenuPuentes && dropdownPuentes) {
    btnMenuPuentes.addEventListener('click', (e) => {
      e.stopPropagation();
      const estaAbierto = dropdownPuentes.style.display === 'block';
      dropdownPuentes.style.display = estaAbierto ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      dropdownPuentes.style.display = 'none';
    });
  }

  document.querySelectorAll('#menu-navegacion .nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      paginaActual = 0;
      const inputBuscador = document.getElementById('input-buscador-publico');
      if (inputBuscador) inputBuscador.value = '';
      
      cargarNoticiasEnVivo(btn.getAttribute('data-categoria'), 0);
    });
  });

  const inputBuscadorPublico = document.getElementById('input-buscador-publico');

  if (inputBuscadorPublico) {
    inputBuscadorPublico.addEventListener('input', (e) => {
      const textoBusqueda = e.target.value.toLowerCase().trim();
      const contenedorNoticias = document.querySelector('.contenedor-noticias');

      if (!contenedorNoticias) return;

      if (textoBusqueda === '') {
        renderizarListaNoticias(listaNoticiasCargadas, contenedorNoticias, false);
        return;
      }

      const noticiasFiltradas = listaNoticiasCargadas.filter(nota => {
        const titulo = nota.titulo ? nota.titulo.toLowerCase() : '';
        const contenido = nota.contenido ? nota.contenido.toLowerCase() : '';
        const categoria = nota.categoria ? nota.categoria.toLowerCase() : '';
        
        return titulo.includes(textoBusqueda) || 
               contenido.includes(textoBusqueda) || 
               categoria.includes(textoBusqueda);
      });

      if (noticiasFiltradas.length === 0) {
        contenedorNoticias.innerHTML = `
          <div style="grid-column: span 2; text-align: center; padding: 30px; background: #0f172a; border-radius: 8px; color: #94a3b8; border: 1px solid #1e293b;">
            <p>No se encontraron noticias con "${e.target.value}"</p>
          </div>`;
        return;
      }

      renderizarListaNoticias(noticiasFiltradas, contenedorNoticias, true);
    });
  }
});
