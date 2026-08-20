// ==========================================
// 1. CONFIGURACIÓN Y CLIENTE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

const supabaseClient = window.supabase 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Variable global para almacenar las noticias cargadas
let listaNoticiasCargadas = [];

// ==========================================
// 2. CARGAR CLIMA DETALLADO
// ==========================================
async function cargarClimaJuarez() {
  const widgetClima = document.getElementById('widget-clima');
  if (!widgetClima) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=31.7387&longitude=-106.487&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=America%2FDenver';
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.current) {
      const temp = Math.round(data.current.temperature_2m);
      const sensacion = Math.round(data.current.apparent_temperature);
      const humedad = data.current.relative_humidity_2m;
      const viento = Math.round(data.current.wind_speed_10m);
      const code = data.current.weather_code;

      let condicion = 'Despejado';
      if (code >= 1 && code <= 3) condicion = 'Parcialmente Nublado';
      else if (code >= 45 && code <= 48) condicion = 'Neblina';
      else if (code >= 51 && code <= 67) condicion = 'Lluvia Ligera';
      else if (code >= 80 && code <= 82) condicion = 'Chubascos';
      else if (code >= 95) condicion = 'Tormenta';

      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
      const horaFormateada = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      widgetClima.innerHTML = `
        <div style="font-family: sans-serif; color: #f8fafc; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-weight: bold; font-size: 0.9rem; color: #38bdf8; text-transform: uppercase;">📍 Cd. Juárez</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">Actualizado: ${fechaFormateada}, ${horaFormateada}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <span style="font-size: 1.8rem; font-weight: bold; color: #ffffff; line-height: 1;">${temp}°C</span>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #cbd5e1;">${condicion}</p>
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
              <div>Sensación: <strong style="color:#e2e8f0;">${sensacion}°C</strong></div>
              <div>Humedad: <strong style="color:#e2e8f0;">${humedad}%</strong></div>
              <div>Viento: <strong style="color:#e2e8f0;">${viento} km/h</strong></div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al cargar clima:", error);
  }
}

// ==========================================
// 3. CARGAR TIPO DE CAMBIO
// ==========================================
async function cargarTipoCambio() {
  const usdCompra = document.getElementById('usd-compra');
  const usdVenta = document.getElementById('usd-venta');
  const eurMxn = document.getElementById('eur-mxn');

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    if (data && data.rates && data.rates.MXN) {
      const mxn = data.rates.MXN;
      const eur = data.rates.EUR;
      
      if (usdCompra) usdCompra.textContent = `$${(mxn - 0.40).toFixed(2)}`;
      if (usdVenta) usdVenta.textContent = `$${mxn.toFixed(2)}`;
      if (eurMxn) eurMxn.textContent = `$${(mxn / eur).toFixed(2)}`;
    }
  } catch (error) {
    console.error("Error al cargar tipo de cambio:", error);
  }
}

// ==========================================
// 4. CARGAR TIEMPOS DE PUENTES
// ==========================================
async function cargarTiemposPuentes() {
  try {
    const response = await fetch('https://bwt.cbp.gov/api/borderwait/port/2402');
    if (response.ok) {
      const data = await response.json();
      console.log("Puentes en vivo:", data);
    }
  } catch (error) {
    console.log("Usando reporte predeterminado de puentes.");
  }
}

// ==========================================
// 5. MOSTRAR MODAL CON IMÁGENES AJUSTADAS AL FINAL
// ==========================================
function abrirModalNoticia(idNota) {
  const nota = listaNoticiasCargadas.find(n => String(n.id) === String(idNota));
  if (!nota) return;

  const modal = document.getElementById('modal-noticia');
  const modalCategoria = document.getElementById('modal-categoria');
  const modalFecha = document.getElementById('modal-fecha');
  const modalTitulo = document.getElementById('modal-titulo');
  const modalGaleria = document.getElementById('modal-galeria');
  const modalContenido = document.getElementById('modal-contenido');

  if (!modal) return;

  // Asignar datos del texto
  modalCategoria.textContent = nota.categoria || 'General';
  modalFecha.textContent = nota.created_at 
    ? new Date(nota.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    : '';
  modalTitulo.textContent = nota.titulo || 'Sin título';
  modalContenido.textContent = nota.contenido || '';

  // Procesar e insertar imágenes AL FINAL con tamaños controlados
  let galeriaHTML = '';
  const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;

  if (textoImagenes) {
    let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
    listaFotos = listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);

    if (listaFotos.length === 1) {
      galeriaHTML = `
        <div style="text-align: center; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px;">
          <img src="${listaFotos[0]}" alt="${nota.titulo}" style="max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #334155;">
        </div>
      `;
    } else if (listaFotos.length > 1) {
      galeriaHTML = `
        <div style="border-top: 1px solid #334155; padding-top: 15px; margin-top: 15px;">
          <small style="color: #94a3b8; display: block; margin-bottom: 8px; font-weight: bold;">Galería de imágenes:</small>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
            ${listaFotos.map(img => `
              <img src="${img}" alt="${nota.titulo}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;">
            `).join('')}
          </div>
        </div>
      `;
    }
  }
  
  modalGaleria.innerHTML = galeriaHTML;

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

// ==========================================
// 6. CARGAR NOTICIAS EN VIVO Y CRONOLOGÍA
// ==========================================
async function cargarNoticiasEnVivo(categoria = 'todas') {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  const carruselCronologico = document.getElementById('carrusel-cronologico');

  if (!supabaseClient) return;

  try {
    let { data: noticias, error } = await supabaseClient
      .from('Noticias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      const res = await supabaseClient.from('noticias').select('*').order('created_at', { ascending: false });
      noticias = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Error al consultar Supabase:", error);
      return;
    }

    listaNoticiasCargadas = noticias || [];

    let noticiasFiltradas = listaNoticiasCargadas;
    if (categoria && categoria.toLowerCase() !== 'todas') {
      noticiasFiltradas = listaNoticiasCargadas.filter(n => 
        n.categoria && n.categoria.toLowerCase().trim() === categoria.toLowerCase().trim()
      );
    }

    if (!noticiasFiltradas || noticiasFiltradas.length === 0) {
      if (contenedorNoticias) {
        contenedorNoticias.innerHTML = `
          <div style="grid-column: span 2; text-align: center; padding: 25px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; color: #475569;">
            <p style="margin-bottom: 5px; font-size: 1.05rem;">No hay noticias registradas en la categoría: <strong>${categoria}</strong></p>
            <small style="color: #94a3b8;">Prueba hacer clic en "Inicio" para recargar la lista general.</small>
          </div>
        `;
      }
      return;
    }

    // RENDERIZAR TARJETAS EN PORTADA USANDO CLASES CSS
    if (contenedorNoticias) {
      contenedorNoticias.innerHTML = noticiasFiltradas.map(nota => {
        let galeriaHTML = '';
        const textoImagenes = nota.imagen_url || nota.galeria || nota.imagen || nota.imagenes;

        if (textoImagenes) {
          let listaFotos = Array.isArray(textoImagenes) ? textoImagenes : String(textoImagenes).split(',');
          listaFotos = listaFotos.map(img => String(img).replace(/\\/g, '/').trim()).filter(img => img.length > 0);

          if (listaFotos.length > 0) {
            galeriaHTML = `<img src="${listaFotos[0]}" alt="${nota.titulo}">`;
          }
        }

        const resumen = nota.contenido && nota.contenido.length > 140 
          ? nota.contenido.substring(0, 140) + '...' 
          : nota.contenido || '';

        // Limpiar formato de categoría para que coincida con las clases del CSS (ej: "seguridad", "medio-ambiente")
        const catClase = nota.categoria ? nota.categoria.toLowerCase().trim().replace(/\s+/g, '-') : 'general';

        return `
          <article class="noticia" onclick="abrirModalNoticia('${nota.id}')" style="cursor: pointer;">
            <span class="categoria ${catClase}">${nota.categoria || 'General'}</span>
            <h2>${nota.titulo || 'Sin título'}</h2>
            ${galeriaHTML}
            <p>${resumen}</p>
            <span style="color: #0284c7; font-size: 0.85rem; font-weight: bold; display: inline-block; margin-top: 8px;">Leer noticia completa →</span>
          </article>
        `;
      }).join('');
    }

    // RENDERIZAR CRONOLOGÍA DE ÚLTIMA HORA
    if (carruselCronologico) {
      carruselCronologico.innerHTML = listaNoticiasCargadas.map(nota => {
        const hora = nota.created_at 
          ? new Date(nota.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) 
          : '--:--';

        return `
          <div class="tarjeta-cronologica" onclick="abrirModalNoticia('${nota.id}')" style="cursor: pointer;">
            <span class="hora">${hora}</span>
            <h4>${nota.titulo || ''}</h4>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error("Error imprevisto:", err);
  }
}

// ==========================================
// 7. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  cargarClimaJuarez();
  cargarTipoCambio();
  cargarTiemposPuentes();
  cargarNoticiasEnVivo();

  const btnCerrar = document.getElementById('cerrar-modal');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalNoticia);
  }

  const modal = document.getElementById('modal-noticia');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModalNoticia();
    });
  }

  const botonesNav = document.querySelectorAll('#menu-navegacion .nav-btn');
  botonesNav.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      botonesNav.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const categoria = btn.getAttribute('data-categoria');
      cargarNoticiasEnVivo(categoria);
    });
  });
});
