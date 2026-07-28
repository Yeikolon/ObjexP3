/* ============================================================
   registro.js
   Página: pages/login/registrarse.html
   Depende de: storage.js, utils.js
   ============================================================ */

const RUTAS_REGISTRO = {
  usuarios: "../../json/usuarios.json"
};

let paisesDisponibles = [];
let usuariosRegistro = [];
let paisElegido = null;

document.addEventListener("DOMContentLoaded", iniciarRegistro);

async function iniciarRegistro() {
  try {
    usuariosRegistro = await cargarColeccion(RUTAS_REGISTRO.usuarios, OBJEX_DB.usuarios);
    await cargarPaises();
    enlazarBuscadorPaises();
    enlazarFormularioRegistro();
    console.log("✅ Registro inicializado correctamente");
  } catch (error) {
    console.error("Error al iniciar registro:", error);
  }
}

/* --------- Consumo de la API de países --------- */
async function fetchJsonConTimeout(url, timeoutMs = 8000) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: { Accept: "application/json" }
    });

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    }

    return await respuesta.json();
  } finally {
    clearTimeout(temporizador);
  }
}

async function cargarPaises() {
  const contenedor = document.getElementById("listaPaises");
  try {
    if (contenedor) {
      contenedor.innerHTML = `<div class="pais-opcion">Cargando países...</div>`;
      contenedor.classList.add("mostrar");
    }

    const datos = await fetchJsonConTimeout("https://restcountries.com/v3.1/all?fields=name,flags");

    if (!Array.isArray(datos) || !datos.length) {
      throw new Error("La API devolvió una respuesta vacía o inválida.");
    }

    paisesDisponibles = datos
      .filter(p => p?.name?.common && p?.flags?.png)
      .map(p => ({
        nombre: p.name.common,
        bandera: p.flags.png
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!paisesDisponibles.length) {
      throw new Error("No se encontraron países válidos en la respuesta.");
    }

    console.log(`${paisesDisponibles.length} países cargados desde RestCountries`);

    if (contenedor) {
      contenedor.innerHTML = "";
      contenedor.classList.remove("mostrar");
    }
  } catch (error) {
    console.warn("Error con RestCountries, usando respaldo:", error.message);

    try {
      const datosRespaldo = await fetchJsonConTimeout("https://countries.dev/countries");

      if (!Array.isArray(datosRespaldo) || !datosRespaldo.length) {
        throw new Error("La API de respaldo devolvió una respuesta inválida.");
      }

      paisesDisponibles = datosRespaldo
        .map(p => ({
          nombre: p?.name || p?.nombre || "País desconocido",
          bandera: p?.flag || p?.bandera || "https://flagcdn.com/default.png"
        }))
        .filter(p => p.nombre !== "País desconocido")
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      if (!paisesDisponibles.length) {
        throw new Error("No se encontraron países válidos en la API de respaldo.");
      }

      console.log(`${paisesDisponibles.length} países cargados desde countries.dev`);
    } catch (errorRespaldo) {
      console.error("Error con ambas APIs, usando países hardcodeados:", errorRespaldo);

      paisesDisponibles = [
        { nombre: "Ecuador", bandera: "https://flagcdn.com/ec.svg" },
        { nombre: "Colombia", bandera: "https://flagcdn.com/co.svg" },
        { nombre: "Argentina", bandera: "https://flagcdn.com/ar.svg" },
        { nombre: "Chile", bandera: "https://flagcdn.com/cl.svg" },
        { nombre: "Perú", bandera: "https://flagcdn.com/pe.svg" },
        { nombre: "México", bandera: "https://flagcdn.com/mx.svg" },
        { nombre: "España", bandera: "https://flagcdn.com/es.svg" },
        { nombre: "Estados Unidos", bandera: "https://flagcdn.com/us.svg" },
        { nombre: "Canadá", bandera: "https://flagcdn.com/ca.svg" },
        { nombre: "Brasil", bandera: "https://flagcdn.com/br.svg" },
        { nombre: "Venezuela", bandera: "https://flagcdn.com/ve.svg" },
        { nombre: "Uruguay", bandera: "https://flagcdn.com/uy.svg" },
        { nombre: "Paraguay", bandera: "https://flagcdn.com/py.svg" },
        { nombre: "Bolivia", bandera: "https://flagcdn.com/bo.svg" },
        { nombre: "Costa Rica", bandera: "https://flagcdn.com/cr.svg" },
        { nombre: "Cuba", bandera: "https://flagcdn.com/cu.svg" },
        { nombre: "República Dominicana", bandera: "https://flagcdn.com/do.svg" },
        { nombre: "El Salvador", bandera: "https://flagcdn.com/sv.svg" },
        { nombre: "Guatemala", bandera: "https://flagcdn.com/gt.svg" },
        { nombre: "Honduras", bandera: "https://flagcdn.com/hn.svg" },
        { nombre: "Nicaragua", bandera: "https://flagcdn.com/ni.svg" },
        { nombre: "Panamá", bandera: "https://flagcdn.com/pa.svg" }
      ].sort((a, b) => a.nombre.localeCompare(b.nombre));

      console.log(`${paisesDisponibles.length} países de respaldo cargados`);
    }

    if (contenedor) {
      contenedor.innerHTML = "";
      contenedor.classList.remove("mostrar");
    }
  }
}

function enlazarBuscadorPaises() {
  const buscador = document.getElementById("buscarPais");
  const contenedor = document.getElementById("listaPaises");
  const nacionalidadInput = document.getElementById("nacionalidad");
  const paisSeleccionado = document.getElementById("paisSeleccionado");
  
  if (!buscador || !contenedor) {
    console.warn(" Elementos del buscador de países no encontrados");
    return;
  }

  buscador.addEventListener("input", debounce(() => {
    const texto = buscador.value.trim().toLowerCase();
    paisElegido = null;
    if (nacionalidadInput) nacionalidadInput.value = "";
    if (paisSeleccionado) paisSeleccionado.innerHTML = "";

    if (!texto) {
      contenedor.innerHTML = "";
      contenedor.classList.remove("mostrar");
      return;
    }

    const coincidencias = paisesDisponibles
      .filter(p => p.nombre.toLowerCase().includes(texto))
      .slice(0, 15);

    if (!coincidencias.length) {
      contenedor.innerHTML = `<div class="pais-opcion">Sin coincidencias.</div>`;
      contenedor.classList.add("mostrar");
      return;
    }

    contenedor.innerHTML = coincidencias.map(p =>
      `<div class="pais-opcion" data-nombre="${p.nombre}">
        <img src="${p.bandera}" alt="Bandera de ${p.nombre}" loading="lazy" 
             onerror="this.src='https://flagcdn.com/default.png'">
        <span>${p.nombre}</span>
      </div>`
    ).join("");

    contenedor.classList.add("mostrar");

    contenedor.querySelectorAll(".pais-opcion[data-nombre]").forEach(opcion => {
      opcion.addEventListener("click", () => {
        const nombre = opcion.dataset.nombre;
        seleccionarPais(nombre);
      });
    });
  }, 250));
}

function seleccionarPais(nombre) {
  const pais = paisesDisponibles.find(p => p.nombre === nombre);
  if (!pais) return;

  paisElegido = pais;
  
  const nacionalidadInput = document.getElementById("nacionalidad");
  const buscador = document.getElementById("buscarPais");
  const contenedor = document.getElementById("listaPaises");
  const paisSeleccionado = document.getElementById("paisSeleccionado");

  if (nacionalidadInput) nacionalidadInput.value = pais.nombre;
  if (buscador) buscador.value = pais.nombre;
  if (contenedor) {
    contenedor.innerHTML = "";
    contenedor.classList.remove("mostrar");
  }
  if (paisSeleccionado) {
    paisSeleccionado.innerHTML = `
      <img src="${pais.bandera}" alt="Bandera de ${pais.nombre}" 
           onerror="this.src='https://flagcdn.com/default.png'">
      Nacionalidad seleccionada: ${pais.nombre}
    `;
  }
}

/* --------- Envío del formulario --------- */
function enlazarFormularioRegistro() {
  const form = document.getElementById("form-registro");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    procesarRegistro(form);
  });
}

function procesarRegistro(form) {
  const nombres = form.nombre.value.trim();
  const apellidos = form.apellido.value.trim();
  const genero = form.genero ? form.genero.value : "";
  const correo = form.correo.value.trim().toLowerCase();
  const contrasena = form.contrasena.value;
  const confirmar = form.confirmar.value;
  const fechaNacimiento = form.fechaNacimiento.value;
  const avatar = form.avatar ? form.avatar.value.trim() : "";
  const terminos = form.terminos.checked;
  const nacionalidad = form.nacionalidad ? form.nacionalidad.value.trim() : "";

  if (!nombres || !apellidos || !correo) {
    mostrarError("Completa nombres, apellidos y correo.");
    return;
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoValido.test(correo)) {
    mostrarError("Ingresa un correo válido.");
    return;
  }

  if (usuariosRegistro.some(u => u.correo.toLowerCase() === correo)) {
    mostrarError("Ya existe una cuenta registrada con ese correo.");
    return;
  }

  if (contrasena.length < 8) {
    mostrarError("La contraseña debe tener al menos 8 caracteres.");
    return;
  }

  if (contrasena !== confirmar) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }

  if (!fechaNacimiento) {
    mostrarError("Ingresa tu fecha de nacimiento.");
    return;
  }

  if (!paisElegido && !nacionalidad) {
    mostrarError("Selecciona tu nacionalidad de la lista.");
    return;
  }

  const paisValido = paisesDisponibles.some(p => p.nombre.toLowerCase() === nacionalidad.toLowerCase());
  if (nacionalidad && !paisValido) {
    mostrarError("La nacionalidad seleccionada no es válida.");
    return;
  }

  if (!terminos) {
    mostrarError("Debes aceptar los términos y condiciones.");
    return;
  }

  const nuevoUsuario = {
    id: generarId(usuariosRegistro),
    nombres,
    apellidos,
    correo,
    contrasena,
    genero,
    avatar: avatar || "src/icons/usuario.png",
    confiabilidad: 50,
    fechaRegistro: new Date().toISOString().split("T")[0],
    nacionalidad: paisElegido ? paisElegido.nombre : nacionalidad,
    contacto: {
      telefono: "",
      ciudad: ""
    }
  };

  usuariosRegistro.push(nuevoUsuario);
  const guardado = guardarColeccion(OBJEX_DB.usuarios, usuariosRegistro);

  if (!guardado) {
    mostrarError("No se pudo completar el registro. Intenta nuevamente.");
    return;
  }

  guardarSesion(nuevoUsuario);
  notificar("Cuenta creada correctamente.", "exito");

  setTimeout(() => {
    window.location.href = "../perfil/perfil.html";
  }, 1000);
}