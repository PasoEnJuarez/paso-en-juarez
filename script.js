document.addEventListener("DOMContentLoaded", () => {
  // Configuración de Supabase
  const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Elementos principales del DOM
  const contenedorNoticias = document.getElementById('contenedor-noticias');
  const carruselCronologico = document.getElementById('carrusel-cronologico');
  const navLinks = document.querySelectorAll('header nav a');

  let categoriaActual = 'todas';

  // Inicializar carga de datos
  cargarAnunciosPublicitarios();
  cargarNoticias(categoriaActual);

  // Manejo de navegación por categorías
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      categoriaActual = link.getAttribute('data-categoria') || 'todas';
      cargarNoticias(categoriaActual);
    });
  });

  // --- FUNCIÓN PARA CARGAR ANUNCIOS PUBLICITARIOS ---
  async function cargarAnunciosPublicitarios() {
    try {
      const { data, error } = await supabaseClient.from('Anuncios').select('*');
      if (error || !data) return;

      // Mapear los espacios publicitarios según su posición (0, 1, 2, 3)
      // Asumiendo que tienes 4 contenedores en tu HTML con clases o IDs específicos para los banners laterales
      data.forEach(anuncio => {
        // Buscamos el contenedor correspondiente según la posición guardada
        const selector = `[data-posicion-anuncio="${anuncio.posicion}"]`;
        const cajaAnuncio = document.querySelector(selector);
        
        if (cajaAnuncio) {
          cajaAnuncio.innerHTML = `
            <a href="${anuncio.link}" target="_blank" rel="noopener noreferrer" title="${anuncio.nombre}">
              <img src="${anuncio.imagen}" alt="${anuncio.nombre}">
            </a>
          `;
        }
      });
    } catch (err) {
      console.error('Error al cargar anuncios publicitarios:', err);
    }
  }

  // --- FUNCIÓN PARA CARGAR NOTICIAS ---
  async function cargarNoticias(categoria) {
    if (!contenedorNoticias) return;

    contenedorNoticias.innerHTML = '<div class="spinner-carga"></div>';

    let query = supabaseClient.from('Noticias').select('*').order('id', { ascending: false });

    if (categoria !== 'todas') {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;

    if (error) {
      contenedorNoticias.innerHTML = '<p style="text-align:center; color:#f43f5e;">Error al cargar las noticias.</p>';
      return;
    }

    if (!data || data.length === 0) {
      contenedorNoticias.innerHTML = '<p style="text-align:center; color:#94a3b8; grid-column: span 2;">No hay noticias disponibles en esta categoría.</p>';
      if (carruselCronologico) carruselCronologico.innerHTML = '<p style="padding: 10px; color: #94a3b8;">Sin actividad reciente.</p>';
      return;
    }

    renderizarNoticias(data);
    renderizarCronologia(data);
  }

  // --- RENDERIZAR REJILLA DE NOTICIAS ---
  function renderizarNoticias(noticias) {
    contenedorNoticias.innerHTML = '';

    noticias.forEach(n => {
      const foto = n.imagen_url || n.imagen || 'https://via.placeholder.com/400x200';
      const categoriaClase = (n.categoria || 'general').toLowerCase().replace(/\s+/g, '-');
      
      const tarjeta = document.createElement('div');
      tarjeta.className = 'noticia';
      tarjeta.innerHTML = `
        <span class="categoria ${categoriaClase}">${n.categoria || 'General'}</span>
        <img src="${foto}" alt="${n.titulo}" onerror="this.src='https://via.placeholder.com/400x200'">
        <h2>${n.titulo}</h2>
        <p>${truncarTexto(n.contenido, 120)}</p>
        <button class="btn-leer-mas" style="margin-top:12px; background:#2563eb; color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:600;">Leer más</button>
      `;

      // Evento para abrir el modal de noticia completa
      tarjeta.querySelector('.btn-leer-mas').addEventListener('click', () => {
        abrirModalNoticia(n);
      });

      contenedorNoticias.appendChild(tarjeta);
    });
  }

  // --- RENDERIZAR CARRUSEL CRONOLÓGICO ---
  function renderizarCronologia(noticias) {
    if (!carruselCronologico) return;
    carruselCronologico.innerHTML = '';

    // Tomamos las más recientes para la barra cronológica
    noticias.slice(0, 8).forEach(n => {
      const item = document.createElement('div');
      item.className = 'tarjeta-cronologica';
      item.innerHTML = `
        <span class="hora">Reciente</span>
        <h4>${n.titulo}</h4>
      `;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => abrirModalNoticia(n));
      carruselCronologico.appendChild(item);
    });
  }

  // --- MODAL DE NOTICIA ---
  function abrirModalNoticia(noticia) {
    // Eliminar modal previo si existe
    const modalExistente = document.getElementById('modal-detalle-noticia');
    if (modalExistente) modalExistente.remove();

    const foto = noticia.imagen_url || noticia.imagen || '';
    const categoriaClase = (noticia.categoria || 'general').toLowerCase().replace(/\s+/g, '-');

    const modal = document.createElement('div');
    modal.id = 'modal-detalle-noticia';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-contenedor">
        <button class="modal-btn-cerrar">&times;</button>
        <div class="modal-meta">
          <span class="modal-tag ${categoriaClase}">${noticia.categoria || 'General'}</span>
        </div>
        <h2 class="modal-title">${noticia.titulo}</h2>
        ${foto ? `<img src="${foto}" alt="Imagen" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px; margin-bottom:15px;">` : ''}
        ${noticia.video_url ? `<div style="margin-bottom:15px;"><a href="${noticia.video_url}" target="_blank" style="color:#38bdf8;">Ver Video Relacionado</a></div>` : ''}
        <div class="modal-body-content">${noticia.contenido}</div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cerrar modal
    modal.querySelector('.modal-btn-cerrar').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  function truncarTexto(texto, limite) {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }
});
