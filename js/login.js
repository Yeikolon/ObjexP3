/* ============================================================
   login.js
   Página: index.html
   Depende de: storage.js, utils.js (SweetAlert2)
   ============================================================ */

const RUTAS_LOGIN = {
  usuarios: "json/usuarios.json"
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = form.correo.value.trim().toLowerCase();
    const contrasena = form.contrasena.value;

    if (!correo || !contrasena) {
      mostrarError("Ingresa tu correo y tu contraseña.");
      return;
    }

    try {
      const usuarios = await cargarColeccion(RUTAS_LOGIN.usuarios, OBJEX_DB.usuarios);
      const usuario = usuarios.find(u => u.correo.toLowerCase() === correo);

      if (!usuario) {
        mostrarError("No existe una cuenta registrada con ese correo.");
        return;
      }

      if (usuario.contrasena !== contrasena) {
        mostrarError("La contraseña ingresada es incorrecta.");
        return;
      }

      guardarSesion(usuario);
      notificar(`Bienvenido, ${usuario.nombres}.`, "exito");

      setTimeout(() => {
        window.location.href = "pages/publicaciones/publicaciones.html";
      }, 900);

    } catch (error) {
      console.error(error);
      mostrarError("No se pudo iniciar sesión. Intenta nuevamente.");
    }
  });
});