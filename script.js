// ==========================================================
// 1. CONFIGURACIÓN Y CLIENTE SUPABASE
// ==========================================================
const SUPABASE_URL = 'https://akwnmorymjhthdkcebri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1oNA-SbdvgSbWEwy_jZNew_UX4JVIMT';

const supabaseClient = window.supabase 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

let listaNoticiasCargadas = [];

// ==========================================================
// 2. CARGAR CLIMA DETALLADO
// ==========================================================
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

// ==========================================================
// 3. CARGAR TIPO DE CAMBIO
// ==========================================================
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

// ==========================================================
// 4. CARGAR TIEMPOS DE PUENTES (A TRAVÉS DE SUPABASE PROXY)
// ==========================================================
async function cargarTiemposPuentes() {
  const widgetPuentesMini = document.getElementById('widget-puentes-mini');
  if (!widgetPuentesMini) return;

  try {
    // URL de tu función pública en Supabase
    const urlProxy = 'https://akwnmorymjhthdkcebri.supabase.co/functions/v1/obtener-puentes';
    
    // Petición simple: al ser pública, ya no requiere headers de autenticación
    const response = await fetch(urlProxy);

    if (!response.ok) throw new Error('Error al conectar con el proxy de Supabase');
    
    const data = await response.json();
    
    const mapaPuentes = {
      "Paso Del Norte": "Paso del Norte",
      "Bridge of the Americas": "Córdova (Libre)",
      "Ysleta": "Zaragoza",
      "Santa Teresa": "Jerónimo-St. Teresa"
    };

    let htmlPuentes = '';
    
    for (const [nombreCBP, nombreUI] of Object.entries(mapaPuentes)) {
      const puenteData = data.find(p => p.port_name && p.port_name.includes(nombreCBP));
      
      if (puenteData && puenteData.passenger_vehicles) {
        const espera = puenteData.passenger_vehicles.delay_minutes || 0;
        let claseTiempo = espera > 60 ? 'tiempo-lento' : (espera > 30 ? 'tiempo-medio' : 'tiempo-rapido');

        htmlPuentes += `
          <div class="pm-item">
            <span class="pm-nombre">${nombreUI}</span>
            <span class="minutos ${claseTiempo}">${espera}m</span>
          </div>
        `;
      }
    }
    widgetPuentesMini.innerHTML = htmlPuentes || '<p>Datos no disponibles</p>';
  } catch (error) {
    console.error("Error al cargar puentes:", error);
  }
}

// ==========================================================
// 5. MODALES Y NOTICIAS
// ==========================================================
function abrirModalNoticia(idNota) {
  const nota = listaNoticiasCargadas.find(n => String(n.id) === String(idNota));
  if (!nota) return;
  const modal = document.getElementById('modal-noticia');
  document.getElementById('modal-categoria').textContent = nota.categoria || 'General';
  document.getElementById('modal-titulo').textContent = nota.titulo || 'Sin título';
  document.getElementById('modal-contenido').textContent = nota.contenido || '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModalNoticia() {
  document.getElementById('modal-noticia').style.display = 'none';
  document.body.style.overflow = 'auto';
}

async function cargarNoticiasEnVivo(categoria = 'todas') {
  const contenedorNoticias = document.querySelector('.contenedor-noticias');
  if (!supabaseClient) return;
  let { data: noticias } = await supabaseClient.from('Noticias').select('*').order('created_at', { ascending: false });
  listaNoticiasCargadas = noticias || [];
  if (contenedorNoticias) {
    contenedorNoticias.innerHTML = listaNoticiasCargadas.map(nota => `
      <article class="noticia" onclick="abrirModalNoticia('${nota.id}')" style="cursor:pointer;">
        <h2>${nota.titulo}</h2>
        <p>${nota.contenido?.substring(0,100)}...</p>
      </article>
    `).join('');
  }
}

// ==========================================================
// 6. INICIALIZACIÓN
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  cargarClimaJuarez();
  cargarTipoCambio();
  cargarTiemposPuentes();
  cargarNoticiasEnVivo();

  setInterval(cargarClimaJuarez, 600000);
  setInterval(cargarTiemposPuentes, 300000);
  setInterval(cargarTipoCambio, 300000);
});
