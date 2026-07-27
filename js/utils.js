/* ============================================================
   utils.js
   Funciones auxiliares reutilizables en todo Objex.
   Depende de: SweetAlert2 (Swal) y Toastify (Toastify)
   ============================================================ */

/**
 * Muestra una notificación breve (esquina superior).
 * @param {string} mensaje
 * @param {"exito"|"error"|"info"} tipo
 */
function notificar(mensaje, tipo = "info") {
  const colores = {
    exito: "#2e7d32",
    error: "#c62828",
    info: "#1565c0"
  };

  Toastify({
    text: mensaje,
    duration: 3000,
    gravity: "top",
    position: "right",
    close: true,
    style: { background: colores[tipo] || colores.info }
  }).showToast();
}

/**
 * Pide confirmación antes de una acción destructiva (eliminar, restablecer).
 * @returns {Promise<boolean>} true si el usuario confirmó
 */
async function confirmar(titulo, texto, textoBoton = "Sí, continuar") {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c62828",
    cancelButtonColor: "#6c757d"
  });

  return resultado.isConfirmed;
}

/**
 * Muestra información detallada de un registro en un modal SweetAlert2 con HTML.
 * @param {string} titulo
 * @param {string} htmlContenido
 */
function mostrarDetalle(titulo, htmlContenido) {
  Swal.fire({
    title: titulo,
    html: htmlContenido,
    confirmButtonText: "Cerrar",
    confirmButtonColor: "#1565c0",
    width: 600
  });
}

/**
 * Muestra un error de forma amigable (para catch de fetch, JSON, etc.)
 */
function mostrarError(mensaje) {
  Swal.fire({
    title: "Ocurrió un problema",
    text: mensaje,
    icon: "error",
    confirmButtonText: "Entendido",
    confirmButtonColor: "#c62828"
  });
}

/**
 * Debounce: retrasa la ejecución de una función hasta que
 * el usuario deja de escribir. Útil para el buscador en tiempo real.
 */
function debounce(fn, espera = 300) {
  let temporizador;
  return function (...args) {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn.apply(this, args), espera);
  };
}

/**
 * Formatea una fecha "YYYY-MM-DD" a un texto relativo tipo
 * "Hace 2 días" o, si es muy antigua, a fecha legible.
 */
function formatearFechaRelativa(fechaISO) {
  const fecha = new Date(fechaISO + "T00:00:00");
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isNaN(diffDias)) return fechaISO;
  if (diffDias <= 0) return "Hoy";
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `Hace ${diffDias} días`;
  if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semana(s)`;

  return fecha.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Muestra u oculta un indicador de carga simple dentro de un contenedor.
 * Requiere que el contenedor exista en el DOM.
 */
function mostrarCargando(idContenedor, mostrar = true, mensaje = "Cargando información...") {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  if (mostrar) {
    contenedor.innerHTML = `
      <div class="objex-cargando" style="text-align:center; padding:2rem;">
        <div class="spinner-border" role="status"></div>
        <p>${mensaje}</p>
      </div>`;
  }
}

/**
 * Muestra un mensaje de "sin resultados" dentro de un contenedor.
 */
function mostrarSinResultados(idContenedor, mensaje = "No se encontraron resultados.") {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="objex-sin-resultados" style="text-align:center; padding:2rem;">
      <i class="fa-solid fa-magnifying-glass" style="font-size:2rem;"></i>
      <p>${mensaje}</p>
    </div>`;
}