/* ============================================================
   publicaciones.js
   Página: pages/publicaciones/publicaciones.html
   Depende de: storage.js, utils.js
   ============================================================ */

const RUTAS_PUB = {
  categorias: "../../json/categorias.json",
  ubicaciones: "../../json/ubicaciones.json",
  usuarios: "../../json/usuarios.json",
  publicaciones: "../../json/publicaciones.json"
};

// Estado en memoria de la página
let estadoPub = {
  publicaciones: [],
  categorias: [],
  ubicaciones: [],
  usuarios: [],
  filtroTexto: "",
  filtroCategoria: "todos",
  filtroUbicacion: "toda",
  filtroEstado: "todos",
  orden: "recientes",
  paginaActual: 1,
  porPagina: 6
};

let miGrafico = null;

document.addEventListener("DOMContentLoaded", iniciarPublicaciones);

async function iniciarPublicaciones() {
  mostrarCargando("contenedor", true, "Cargando publicaciones...");

  try {
    const [categorias, ubicaciones, usuarios, publicaciones] = await Promise.all([
      cargarColeccion(RUTAS_PUB.categorias, OBJEX_DB.categorias),
      cargarColeccion(RUTAS_PUB.ubicaciones, OBJEX_DB.ubicaciones),
      cargarColeccion(RUTAS_PUB.usuarios, OBJEX_DB.usuarios),
      cargarColeccion(RUTAS_PUB.publicaciones, OBJEX_DB.publicaciones)
    ]);

    estadoPub.categorias = categorias;
    estadoPub.ubicaciones = ubicaciones;
    estadoPub.usuarios = usuarios;
    estadoPub.publicaciones = publicaciones;

    poblarSelect("categoria", categorias, "todos", "Todas las categorías");
    poblarSelect("ubicacion", ubicaciones, "toda", "Toda la universidad");

    renderDestacados();
    renderIndicadores();
    aplicarFiltrosYRenderizar();
    enlazarEventos();

  } catch (error) {
    console.error(error);
    mostrarError("No se pudieron cargar las publicaciones. Intenta recargar la página.");
  }
}

/* --------- Poblar selects dinámicamente desde JSON --------- */
function poblarSelect(idSelect, coleccion, valorTodos, textoTodos) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  select.innerHTML = `<option value="${valorTodos}">${textoTodos}</option>`;
  coleccion.forEach(item => {
    const opcion = document.createElement("option");
    opcion.value = item.valor;
    opcion.textContent = item.nombre;
    select.appendChild(opcion);
  });
}

/* --------- Relaciones entre JSON (find) --------- */
function obtenerCategoria(categoriaId) {
  return estadoPub.categorias.find(c => c.id === categoriaId) || null;
}

function obtenerUbicacion(ubicacionId) {
  return estadoPub.ubicaciones.find(u => u.id === ubicacionId) || null;
}

function obtenerUsuario(usuarioId) {
  return estadoPub.usuarios.find(u => u.id === usuarioId) || null;
}

/* --------- Filtro + búsqueda + orden --------- */
function obtenerPublicacionesFiltradas() {
  let lista = [...estadoPub.publicaciones];
  const texto = estadoPub.filtroTexto.trim().toLowerCase();

  if (texto) {
    lista = lista.filter(p =>
      p.titulo.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto)
    );
  }

  if (estadoPub.filtroCategoria !== "todos") {
    lista = lista.filter(p => {
      const cat = obtenerCategoria(p.categoriaId);
      return cat && cat.valor === estadoPub.filtroCategoria;
    });
  }

  if (estadoPub.filtroUbicacion !== "toda") {
    lista = lista.filter(p => {
      const ub = obtenerUbicacion(p.ubicacionId);
      return ub && ub.valor === estadoPub.filtroUbicacion;
    });
  }

  if (estadoPub.filtroEstado !== "todos") {
    lista = lista.filter(p => p.estado === estadoPub.filtroEstado);
  }

  switch (estadoPub.orden) {
    case "recientes":
      lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      break;
    case "antiguos":
      lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      break;
    case "az":
      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
      break;
    case "za":
      lista.sort((a, b) => b.titulo.localeCompare(a.titulo));
      break;
  }

  return lista;
}

/* --------- Render principal (tarjetas + paginación) --------- */
function aplicarFiltrosYRenderizar() {
  const lista = obtenerPublicacionesFiltradas();
  estadoPub.paginaActual = Math.min(estadoPub.paginaActual, Math.max(1, Math.ceil(lista.length / estadoPub.porPagina)));

  renderTarjetas(lista);
  renderPaginacion(lista.length);
  renderIndicadores(lista.length);
}

function renderTarjetas(lista) {
  const contenedor = document.getElementById("contenedor");
  if (!contenedor) return;

  if (!lista.length) {
    mostrarSinResultados("contenedor", "No hay publicaciones que coincidan con tu búsqueda.");
    return;
  }

  const inicio = (estadoPub.paginaActual - 1) * estadoPub.porPagina;
  const pagina = lista.slice(inicio, inicio + estadoPub.porPagina);

  contenedor.innerHTML = pagina.map(p => {
    const categoria = obtenerCategoria(p.categoriaId);
    const ubicacion = obtenerUbicacion(p.ubicacionId);

    // ✅ CORREGIDO: Validar que la imagen existe
    let imagenSrc = "../../src/icons/usuario.png"; // Imagen por defecto
    if (p.imagen) {
      // Si la imagen ya tiene una ruta válida
      if (p.imagen.startsWith("src/")) {
        imagenSrc = "../../" + p.imagen;
      } else if (p.imagen.startsWith("../../")) {
        imagenSrc = p.imagen;
      } else {
        imagenSrc = "../../src/icons/usuario.png";
      }
    }

    console.log("Imagen para:", p.titulo, "=>", imagenSrc); // 🔍 Para depurar

    return `
      <article class="card">
        <img src="${imagenSrc}" alt="${p.titulo}" width="100%" height="50%"
             onerror="this.src='../../src/icons/usuario.png'">
        <section class="texto">
          <label class="${p.estado}">${p.estado === "perdido" ? "Perdido" : "Encontrado"}</label>
          <label class="fecha">${formatearFechaRelativa(p.fecha)}</label>
        </section>
        <h4>${p.titulo}</h4>
        <p class="descripcion">${p.descripcion}</p>
        <p style="font-size:0.8rem;">
          <i class="fa-solid fa-tag"></i> ${categoria ? categoria.nombre : "Sin categoría"} &middot;
          <i class="fa-solid fa-location-dot"></i> ${ubicacion ? ubicacion.nombre : "Sin ubicación"}
        </p>
        <a href="#" class="ver-detalle" data-id="${p.id}">Ver Detalles...</a><br><br>
      </article>`;
  }).join("");

  contenedor.querySelectorAll(".ver-detalle").forEach(enlace => {
    enlace.addEventListener("click", (e) => {
      e.preventDefault();
      const id = Number(enlace.dataset.id);
      mostrarDetallePublicacion(id);
    });
  });
}

function renderPaginacion(totalResultados) {
  const contenedor = document.getElementById("paginas");
  if (!contenedor) return;

  const totalPaginas = Math.max(1, Math.ceil(totalResultados / estadoPub.porPagina));
  let html = `<a href="#" data-pagina="prev">&lt;</a>`;

  for (let i = 1; i <= totalPaginas; i++) {
    html += `<a href="#" data-pagina="${i}" style="${i === estadoPub.paginaActual ? "text-decoration: underline;" : ""}">${i}</a>`;
  }

  html += `<a href="#" data-pagina="next">&gt;</a>`;
  contenedor.innerHTML = html;

  contenedor.querySelectorAll("a").forEach(enlace => {
    enlace.addEventListener("click", (e) => {
      e.preventDefault();
      const valor = enlace.dataset.pagina;

      if (valor === "prev") estadoPub.paginaActual = Math.max(1, estadoPub.paginaActual - 1);
      else if (valor === "next") estadoPub.paginaActual = Math.min(totalPaginas, estadoPub.paginaActual + 1);
      else estadoPub.paginaActual = Number(valor);

      aplicarFiltrosYRenderizar();
    });
  });
}

/* --------- Indicadores --------- */
function renderIndicadores(totalFiltrados) {
  const contenedor = document.getElementById("indicadores");
  if (!contenedor) return;

  const total = estadoPub.publicaciones.length;
  const perdidos = estadoPub.publicaciones.filter(p => p.estado === "perdido").length;
  const encontrados = estadoPub.publicaciones.filter(p => p.estado === "encontrado").length;

  contenedor.innerHTML = `
    <span><b>${total}</b> registros totales</span> &middot;
    <span><b>${perdidos}</b> perdidos</span> &middot;
    <span><b>${encontrados}</b> encontrados</span>
    ${totalFiltrados !== undefined ? `&middot; <span><b>${totalFiltrados}</b> en esta búsqueda</span>` : ""}
  `;
}

/* --------- Destacados (carrusel) --------- */
function renderDestacados() {
  const inner = document.querySelector("#carouselDestacados .carousel-inner");
  const indicadores = document.querySelector("#carouselDestacados .carousel-indicators");
  if (!inner) return;

  const destacados = estadoPub.publicaciones.filter(p => p.destacado);
  if (!destacados.length) return;

  inner.innerHTML = destacados.map((p, i) => {
    const ubicacion = obtenerUbicacion(p.ubicacionId);
    

    let imagenSrc = "../../src/icons/usuario.png";
    if (p.imagen) {
      if (p.imagen.startsWith("src/")) {
        imagenSrc = "../../" + p.imagen;
      } else if (p.imagen.startsWith("../../")) {
        imagenSrc = p.imagen;
      }
    }

    return `
      <div class="carousel-item ${i === 0 ? "active" : ""}">
        <img src="${imagenSrc}" class="d-block w-100" alt="${p.titulo}" onerror="this.src='../../src/icons/usuario.png'">
        <div class="carousel-caption">
          <h5>${p.titulo}</h5>
          <p>${ubicacion ? ubicacion.nombre : ""} &middot; ${formatearFechaRelativa(p.fecha)}</p>
        </div>
      </div>`;
  }).join("");

  if (indicadores) {
    indicadores.innerHTML = destacados.map((_, i) =>
      `<button type="button" data-bs-target="#carouselDestacados" data-bs-slide-to="${i}"
        class="${i === 0 ? "active" : ""}" aria-label="Slide ${i + 1}"></button>`
    ).join("");
  }
}

/* --------- Modal de detalle --------- */
function mostrarDetallePublicacion(id) {
  const publicacion = estadoPub.publicaciones.find(p => p.id === id);
  if (!publicacion) {
    mostrarError("No se encontró la publicación solicitada.");
    return;
  }

  const categoria = obtenerCategoria(publicacion.categoriaId);
  const ubicacion = obtenerUbicacion(publicacion.ubicacionId);
  const usuario = obtenerUsuario(publicacion.usuarioId);


  let imagenSrc = "../../src/icons/usuario.png";
  if (publicacion.imagen) {
    if (publicacion.imagen.startsWith("src/")) {
      imagenSrc = "../../" + publicacion.imagen;
    } else if (publicacion.imagen.startsWith("../../")) {
      imagenSrc = publicacion.imagen;
    }
  }

  const html = `
    <div style="text-align:left;">
      <img src="${imagenSrc}" style="width:100%; border-radius:8px; margin-bottom:10px;" onerror="this.src='../../src/icons/usuario.png'">
      <p><b>Estado:</b> ${publicacion.estado === "perdido" ? "Perdido" : "Encontrado"}</p>
      <p><b>Categoría:</b> ${categoria ? categoria.nombre : "N/D"}</p>
      <p><b>Ubicación:</b> ${ubicacion ? ubicacion.nombre : "N/D"}</p>
      <p><b>Fecha:</b> ${formatearFechaRelativa(publicacion.fecha)}</p>
      <p><b>Descripción:</b> ${publicacion.descripcion}</p>
      <p><b>Contacto:</b> ${publicacion.contacto}</p>
      <hr>
      <p><b>Publicado por:</b> ${usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario desconocido"}</p>
      ${usuario ? `<p><b>Confiabilidad:</b> ${usuario.confiabilidad}%</p>` : ""}
    </div>`;

  mostrarDetalle(publicacion.titulo, html);
}

/* --------- Eventos --------- */
function enlazarEventos() {
  const buscar = document.getElementById("buscar");
  const categoria = document.getElementById("categoria");
  const ubicacion = document.getElementById("ubicacion");
  const perdido = document.getElementById("perdido");
  const encontrado = document.getElementById("encontrado");
  const orden = document.getElementById("orden");
  const form = buscar ? buscar.closest("form") : null;

  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }

  if (buscar) {
    buscar.addEventListener("input", debounce((e) => {
      estadoPub.filtroTexto = e.target.value;
      estadoPub.paginaActual = 1;
      aplicarFiltrosYRenderizar();
    }, 300));
  }

  if (categoria) {
    categoria.addEventListener("change", (e) => {
      estadoPub.filtroCategoria = e.target.value;
      estadoPub.paginaActual = 1;
      aplicarFiltrosYRenderizar();
    });
  }

  if (ubicacion) {
    ubicacion.addEventListener("change", (e) => {
      estadoPub.filtroUbicacion = e.target.value;
      estadoPub.paginaActual = 1;
      aplicarFiltrosYRenderizar();
    });
  }

  [perdido, encontrado].forEach(radio => {
    if (!radio) return;
    radio.addEventListener("change", (e) => {
      estadoPub.filtroEstado = e.target.checked ? e.target.value : "todos";
      estadoPub.paginaActual = 1;
      aplicarFiltrosYRenderizar();
    });
  });

  if (orden) {
    orden.addEventListener("change", (e) => {
      estadoPub.orden = e.target.value;
      aplicarFiltrosYRenderizar();
    });
  }
}

function renderGrafico() {
  const canvas = document.getElementById("graficoPublicaciones");
  if (!canvas) return;

  const perdidos = estadoPub.publicaciones.filter(p => p.estado === "perdido").length;
  const encontrados = estadoPub.publicaciones.filter(p => p.estado === "encontrado").length;

  if (miGrafico) {
    miGrafico.destroy();
  }

  const ctx = canvas.getContext("2d");
  miGrafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Perdidos", "Encontrados"],
      datasets: [{
        data: [perdidos, encontrados],
        backgroundColor: ["#c62828", "#2e7d32"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}