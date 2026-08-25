// ==========================================
// 1. CONTROL DEL MENÚ DESPLEGABLE DE PUENTES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnMenuPuentes = document.getElementById('btn-menu-puentes');
  const dropdownPuentes = document.getElementById('dropdown-puentes');

  if (btnMenuPuentes && dropdownPuentes) {
    btnMenuPuentes.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownPuentes.style.display === 'block';
      dropdownPuentes.style.display = isOpen ? 'none' : 'block';
    });

    // Cerrar el menú si se hace clic fuera de él
    document.addEventListener('click', () => {
      dropdownPuentes.style.display = 'none';
    });
  }

  // Carga inicial de Widgets (puedes adaptarla a tus llamadas reales de API o Supabase)
  inicializarWidgets();
});

// ==========================================
// 2. FUNCIONES DE WIDGETS (FECHA, CLIMA Y DÓLAR)
// ==========================================
function inicializarWidgets() {
  // Fecha actual formateada
  const widgetFecha = document.getElementById('widget-fecha');
  if (widgetFecha) {
    const opciones = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const fechaHoy = new Date().toLocaleDateString('es-MX', opciones);
    widgetFecha.innerHTML = `📅 ${fechaHoy}`;
  }

  // Ejemplo de carga para el Clima detallado de Ciudad Juárez
  actualizarWidgetClima(32, "Soleado", 34, 18);
}

function actualizarWidgetClima(temp, condicion, sensacion, humedad) {
  const elPrincipal = document.getElementById('clima-principal');
  const elDetalles = document.getElementById('clima-detalles');

  if (elPrincipal && elDetalles) {
    elPrincipal.innerText = `Juárez: ${temp}°C - ${condicion}`;
    elDetalles.innerText = `Sensación: ${sensacion}°C | Humedad: ${humedad}%`;
  }
}

// Puedes integrar aquí el resto de tu lógica de Supabase, renderizado de noticias, categorías y carrusel.
