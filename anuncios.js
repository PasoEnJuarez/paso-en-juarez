/**
 * SISTEMA DE PUBLICIDAD - PasóEnJuárez
 * 
 * Los anuncios se cargan en orden según su posición en el index.html:
 * 0: Espacio 1 (Superior Izquierda)
 * 1: Espacio 2 (Inferior Izquierda)
 * 2: Espacio 3 (Superior Derecha)
 * 3: Espacio 4 (Inferior Derecha)
 */

const MIS_ANUNCIOS = [
  {
    nombre: "Patrocinador Superior Izquierdo",
    imagen: "images/anuncio1.jpg", 
    link: "https://tu-sitio-o-cliente.com"
  },
  {
    nombre: "Patrocinador Inferior Izquierdo",
    imagen: "images/anuncio2.jpg", 
    link: "https://tu-sitio-o-cliente.com"
  },
  {
    nombre: "Patrocinador Superior Derecho",
    imagen: "images/anuncio3.jpg", 
    link: "https://tu-sitio-o-cliente.com"
  },
  {
    nombre: "Patrocinador Inferior Derecho",
    imagen: "images/anuncio4.jpg", 
    link: "https://tu-sitio-o-cliente.com"
  }
];

// Opcional: Si quieres agregar más anuncios para que rote aleatoriamente 
// en lugar de tenerlos fijos, puedes usar esta lógica:
function obtenerAnuncioParaEspacio(index) {
  return MIS_ANUNCIOS[index] || MIS_ANUNCIOS[0];
}
