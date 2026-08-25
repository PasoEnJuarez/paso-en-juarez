// Configuración de Supabase (Asegúrate de usar tus credenciales reales)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anon-aqui';

// Inicializar cliente de Supabase
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar todos los componentes del sitio
  inicializarWidgets();
  inicializarMenuNavegacion();
  cargarNoticias('todas');
  cargarCronologia();
  
  if (supabaseClient) {
    inicializarPublicidad();
  }
});

/* ==========================================
   1. WIDGETS (FECHA, CLIMA, DÓLAR)
   ========================================== */
function inicializarWidgets() {
  // Widget Fecha
  const elFecha = document.getElementById('widget-fecha');
  if (elFecha) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaActual = new Date().toLocaleDateString('es-ES', opciones);
    elFecha.textContent = `📅 ${fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)}`;
  }

  // Widget Clima (Ciudad Juárez - Datos simulados o API)
  const elClimaPrincipal = document.getElementById('clima-principal');
  const elClimaDetalles = document.getElementById('clima-detalles');
  if (elClimaPrincipal && elClimaDetalles) {
    elClimaPrincipal.textContent = "Juárez: 28°C Soleado";
    elClimaDetalles.textContent = "Sensación 27°C | Humedad 22%";
  }

  // Widget Dólar
  const elDolar = document.getElementById('widget-dolar');
  if (elDolar) {
    elDolar.textContent = "💵 Dólar Compra: $17.50 / Venta: $18.20";
  }

  // Menú desplegable de Puentes
  const btnPuentes = document.getElementById('btn-menu-puentes');
  const dropdownPuentes = document.getElementById('dropdown-puentes');
  if (btnPuentes && dropdownPuentes) {
    btnPuentes.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownPuentes.style.display = dropdownPuentes.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', () => {
      dropdownPuentes.style.display = 'none';
    });
  }
}

/* ==========================================
   2. MENÚ DE NAVEGACIÓN Y CATEGORÍAS
   ========================================== */
function inicializarMenuNavegacion() {
  const botonesMenu = document.querySelectorAll('.nav-btn');
  
  botonesMenu.forEach(boton => {
    boton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remover clase active de todos
      botonesMenu.forEach(b => b.classList.remove('active'));
      // Agregar al actual
      boton.classList.add('active');

      const categoria = boton.getAttribute('data-categoria');
      cargarNoticias(categoria);
    });
  });
}

/* ==========================================
   3. CARGAR NOTICIAS DESDE SUPABASE
   ========================================== */
async function cargarNoticias(categoria) {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  if (!contenedorNoticias) return;

  contenedorNoticias.innerHTML = '<div class="spinner-carga"></div>';

  if (!supabaseClient) {
    contenedorNoticias.innerHTML = '<p style="color: #b91c1c; text-align: center; width: 100%;">Error: Supabase no está configurado correctamente.</p>';
    return;
  }

  try {
    let query = supabaseClient.from('Noticias').select('*').order('created_at', { ascending: false });

    if (categoria && categoria !== 'todas') {
      query = query.eq('categoria', categoria);
    }

    const { data: noticias, error } = await query;

    if (error) throw error;

    if (!noticias || noticias.length === 0) {
      contenedorNoticias.innerHTML = '<p style="color: #64748b; text-align: center; width: 100%;">No hay noticias disponibles en esta categoría.</p>';
      return;
    }

    contenedorNoticias.innerHTML = '';

    noticias.forEach(noticia => {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'noticia';
      
      const fechaFormateada = new Date(noticia.created_at).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      tarjeta.innerHTML = `
        <span class="categoria ${noticia.categoria ? noticia.categoria.toLowerCase().replace(/\s+/g, '-') : 'general'}">${noticia.categoria || 'General'}</span>
        ${noticia.imagen ? `<img src="${noticia.imagen}" alt="${noticia.titulo}">` : ''}
        <h2>${noticia.titulo}</h2>
        <p>${noticia.descripcion_corta || noticia.contenido.substring(0, 100)}...</p>
        <small style="color: #94a3b8; display: block; margin-top: 10px;">📅 ${fechaFormateada}</small>
      `;

      // Evento para abrir el modal con la noticia completa
      tarjeta.addEventListener('click', () => abrirModalNoticia(noticia));

      contenedorNoticias.appendChild(tarjeta);
    });

  } catch (err) {
    console.error("Error al cargar noticias:", err);
    contenedorNoticias.innerHTML = '<p style="color: #b91c1c; text-align: center; width: 100%;">Error al conectar con la base de datos.</p>';
  }
}

/* ==========================================
   4. CRONOLOGÍA / ÚLTIMA HORA
   ========================================== */
async function cargarCronologia() {
  const carrusel = document.getElementById('carrusel-cronologico');
  if (!carrusel || !supabaseClient) return;

  try {
    const { data: cronologias, error } = await supabaseClient
      .from('Cronologia')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !cronologias || cronologias.length === 0) {
      carrusel.innerHTML = '<p style="color: #64748b; padding: 10px;">No hay registros recientes de última hora.</p>';
      return;
    }

    carrusel.innerHTML = '';

    cronologias.forEach(item => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-cronologica';

      const horaFormateada = new Date(item.created_at).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit'
      });

      tarjeta.innerHTML = `
        <span class="hora">⏰ ${horaFormateada}</span>
        <h4>${item.titulo}</h4>
      `;

      carrusel.appendChild(tarjeta);
    });

  } catch (err) {
    console.error("Error al cargar cronología:", err);
    carrusel.innerHTML = '<p style="color: #b91c1c; padding: 10px;">Error al cargar la cronología.</p>';
  }
}

/* ==========================================
   5. PUBLICIDAD DINÁMICA (DESKTOP Y MÓVIL)
   ========================================== */
async function inicializarPublicidad() {
  if (!supabaseClient) return;

  try {
    const { data: anuncios, error } = await supabaseClient.from('Anuncios').select('*');
    if (error || !anuncios) return;

    // Detectar si estamos en un dispositivo móvil (pantalla menor a 1100px)
    const esMovil = window.innerWidth <= 1100;

    const espacios = document.querySelectorAll('[data-posicion-anuncio]');
    
    espacios.forEach(contenedor => {
      const posicion = Number(contenedor.getAttribute('data-posicion-anuncio'));
      const anuncio = anuncios.find(a => Number(a.posicion) === posicion);
      
      if (anuncio) {
        // Seleccionamos imagen_movil o imagen_desktop según el dispositivo, con respaldo a 'imagen'
        const imagenUsar = esMovil ? (anuncio.imagen_movil || anuncio.imagen) : (anuncio.imagen_desktop || anuncio.imagen);

        if (!imagenUsar) return;

        contenedor.innerHTML = `
          <a href="${anuncio.link || '#'}" target="_blank" rel="noopener noreferrer" style="width:100%; height:100%; display:block;" title="${anuncio.nombre || 'Anuncio'}">
            <img src="${imagenUsar}" alt="${anuncio.nombre || 'Anuncio'}" style="width:100%; height:100%; object-fit: ${esMovil ? 'contain' : 'cover'}; background: #ffffff;">
          </a>`;
      }
    });
  } catch (err) {
    console.error("Error al cargar publicidad:", err);
  }
}

/* ==========================================
   6. MODAL DE NOTICIA COMPLETA
   ========================================== */
function abrirModalNoticia(noticia) {
  const modal = document.getElementById('modal-noticia');
  const modalCategoria = document.getElementById('modal-categoria');
  const modalFecha = document.getElementById('modal-fecha');
  const modalTitulo = document.getElementById('modal-titulo');
  const modalContenido = document.getElementById('modal-contenido');
  const modalGaleria = document.getElementById('modal-galeria');
  const btnCerrar = document.getElementById('cerrar-modal');

  if (!modal) return;

  modalCategoria.textContent = noticia.categoria || 'General';
  modalFecha.textContent = new Date(noticia.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  modalTitulo.textContent = noticia.titulo;
  modalContenido.textContent = noticia.contenido;

  // Galería o imagen principal dentro del modal
  modalGaleria.innerHTML = noticia.imagen ? `<img src="${noticia.imagen}" alt="${noticia.titulo}" style="width:100%; max-height:350px; object-fit:cover; border-radius:8px; margin-top:15px;">` : '';

  modal.style.display = 'flex';

  const cerrar = () => {
    modal.style.display = 'none';
  };

  btnCerrar.onclick = cerrar;
  modal.onclick = (e) => {
    if (e.target === modal) cerrar();
  };
}
