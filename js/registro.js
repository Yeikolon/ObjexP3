/* ============================================================
   registro.js
   Página: pages/login/registrarse.html
   Depende de: storage.js, utils.js
   Consume: https://countries.dev/countries (nacionalidad)
   ============================================================ */

const RUTAS_REGISTRO = {
  usuarios: "../../json/usuarios.json"
};

let paisesDisponibles = [];
let usuariosRegistro = [];
let paisElegido = null;

document.addEventListener("DOMContentLoaded", iniciarRegistro);

async function iniciarRegistro() {
  usuariosRegistro = await cargarColeccion(RUTAS_REGISTRO.usuarios, OBJEX_DB.usuarios);
  await cargarPaises();
  enlazarBuscadorPaises();
  enlazarFormularioRegistro();
}

/* --------- Consumo de la API de países (punto 8) --------- */
async function cargarPaises() {
  const contenedor = document.getElementById("listaPaises");
  try {
    if (contenedor) contenedor.innerHTML = `<div class="pais-opcion">Cargando países...</div>`;

    // Cambio de URL a la API estable de RestCountries
    const respuesta = await fetch("https://restcountries.com/v3.1/all?fields=name,flags");
    if (!respuesta.ok) throw new Error(`Estado ${respuesta.status}`);

    const datos = await respuesta.json();
    paisesDisponibles = datos
      .map(p => ({ nombre: p.name.common, bandera: p.flags.png }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (contenedor) contenedor.innerHTML = "";

  } catch (error) {
    console.error("Error al cargar países:", error);
    paisesDisponibles = [];
    if (contenedor) {
      contenedor.innerHTML = `<div class="pais-opcion">No se pudo cargar la lista de países.</div>`;
    }
  }
}

function enlazarBuscadorPaises() {
  const buscador = document.getElementById("buscarPais");
  const contenedor = document.getElementById("listaPaises");
  if (!buscador || !contenedor) return;

  buscador.addEventListener("input", debounce(() => {
    const texto = buscador.value.trim().toLowerCase();
    paisElegido = null;
    document.getElementById("nacionalidad").value = "";

    if (!texto) {
      contenedor.innerHTML = "";
      return;
    }

    const coincidencias = paisesDisponibles
      .filter(p => p.nombre.toLowerCase().includes(texto))
      .slice(0, 15);

    if (!coincidencias.length) {
      contenedor.innerHTML = `<div class="pais-opcion">Sin coincidencias.</div>`;
      return;
    }

    contenedor.innerHTML = coincidencias.map(p =>
      `<div class="pais-opcion" data-nombre="${p.nombre}">
        <img src="${p.bandera}" alt=""> <span>${p.nombre}</span>
      </div>`
    ).join("");

    contenedor.querySelectorAll(".pais-opcion[data-nombre]").forEach(opcion => {
      opcion.addEventListener("click", () => seleccionarPais(opcion.dataset.nombre));
    });
  }, 250));
}

function seleccionarPais(nombre) {
  const pais = paisesDisponibles.find(p => p.nombre === nombre);
  if (!pais) return;

  paisElegido = pais;
  document.getElementById("nacionalidad").value = pais.nombre;
  document.getElementById("buscarPais").value = pais.nombre;
  document.getElementById("listaPaises").innerHTML = "";
  document.getElementById("paisSeleccionado").innerHTML =
    `<img src="${pais.bandera}" alt="" width="20"> Nacionalidad seleccionada: ${pais.nombre}`;
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
  const genero = form.genero.value;
  const correo = form.correo.value.trim().toLowerCase();
  const contrasena = form.contrasena.value;
  const confirmar = form.confirmar.value;
  const fechaNacimiento = form.fechaNacimiento.value;
  const avatar = form.avatar.value.trim();
  const terminos = form.terminos.checked;

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

  if (!paisElegido) {
    mostrarError("Selecciona tu nacionalidad de la lista.");
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
    genero,
    avatar: avatar || "src/icons/usuario.png",
    confiabilidad: 50,
    fechaRegistro: new Date().toISOString().split("T")[0],
    nacionalidad: paisElegido.nombre,
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