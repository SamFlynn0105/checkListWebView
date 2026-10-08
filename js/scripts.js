const elementos = [
    ["Llantas", "◎"],
    ["Luces", "◉"],
    ["Frenos", "!"],
    ["Aceite", "◊"],
    ["Anticongelante", "♨"],
    ["Combustible", "⛽"],
    ["Espejos", "▣"],
    ["Cinturón", "╲"],
    ["Extintor", "♜"],
    ["Triángulos", "△"],
    ["Documentos", "▤"],
    ["Caja limpia", "◇"],
    ["Temperatura caja", "❄"],
    ["Puertas y candado", "♙"],
    ["Carrocería", "▱"],
    ["Cabina limpia", "✣"]
];

const respuestas = {};

const checklist = document.getElementById("checklist");

const API_URL = "https://script.google.com/macros/s/AKfycbxMbhx3QbH_VHnRlG5Z4ahBgOvwpOY_fyObt-vhJeSKWH1yzbsnIUY4Qb01oYrPwsuQ/exec";

// GENERAR ELEMENTOS

elementos.forEach(([nombre, icono], index) => {

    const item = document.createElement("div");

    item.className = "item";

    item.innerHTML = `
        <div class="icono">${icono}</div>

        <div class="nombre">${nombre}</div>

        <div class="opciones">

            <div
                class="radio bien"
                title="Bien"
                onclick="seleccionar(${index}, 'bien', this)">
            </div>

            <div
                class="radio falla"
                title="Falla"
                onclick="seleccionar(${index}, 'falla', this)">
            </div>

        </div>
    `;

    checklist.appendChild(item);

});


// SELECCIONAR RESPUESTA

function seleccionar(index, estado, boton) {

    respuestas[index] = estado;

    const item = boton.closest(".item");

    const botones = item.querySelectorAll(".radio");

    botones.forEach(boton => {
        boton.classList.remove("seleccionado");
    });

    boton.classList.add("seleccionado");

    item.classList.remove("bien", "falla");
    item.classList.add(estado);

    actualizarProgreso();
}


// PROGRESO

function actualizarProgreso() {

    const contestados = Object.keys(respuestas).length;

    const porcentaje =
        (contestados / elementos.length) * 100;

    document.getElementById("contador").textContent =
        `${contestados} / ${elementos.length}`;

    document.getElementById("barra").style.width =
        porcentaje + "%";
}


// FECHA ACTUAL

function colocarFecha() {

    const hoy = new Date();

    const fechaLocal =
        hoy.getFullYear() + "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoy.getDate()).padStart(2, "0");

    document.getElementById("fecha").value = fechaLocal;
}

colocarFecha();


// FINALIZAR

document
    .getElementById("finalizar")
    .addEventListener("click", finalizar);


async function finalizar() {

    const placas =
        document.getElementById("placas").value.trim();

    const kilometraje =
        document.getElementById("kilometraje").value.trim();

    const conductor =
        document.getElementById("conductor").value.trim();


    if (!placas || !kilometraje || !conductor) {

        alert(
            "Complete placas, kilometraje y conductor antes de continuar."
        );

        return;
    }


    if (Object.keys(respuestas).length < elementos.length) {

        const pendientes =
            elementos.length - Object.keys(respuestas).length;

        alert(
            `Faltan ${pendientes} elementos por revisar.`
        );

        return;
    }


    let bien = 0;
    let falla = 0;


    Object.values(respuestas).forEach(resultado => {

        if (resultado === "bien") {
            bien++;
        }

        if (resultado === "falla") {
            falla++;
        }

    });


    document.getElementById("totalBien").textContent = bien;

    document.getElementById("totalFalla").textContent = falla;

    document.getElementById("unidadResultado").textContent =
        `Unidad: ${placas} · ${kilometraje} km`;


    /* document.getElementById("modalFondo").style.display =
        "flex"; */

     const ahora = new Date();

     const horaFin = ahora.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
     });


    // Este objeto será posteriormente el que
    // enviaremos al Excel, base de datos, etc.

    const registro = {

        fecha:
            document.getElementById("fecha").value,

        horaFin,    

        placas,

        kilometraje,

        conductor,

        inspeccion: {},

        observaciones:
            document.getElementById("observaciones").value
    };


    elementos.forEach(([nombre], index) => {

        registro.inspeccion[nombre] =
            respuestas[index];

    });


    console.log("CHECKLIST GENERADO:");
    console.log(registro);
    const enviado =
    await enviarAGoogleSheets(registro);
    
    if (!enviado) {
    return;
    }
    document.getElementById("modalFondo").style.display =
    "flex";
    

}

//enviar a google sheets
async function enviarAGoogleSheets(registro) {

    const boton = document.getElementById("finalizar");

    // Evita que el usuario mande dos veces el mismo registro
    boton.disabled = true;
    boton.textContent = "Enviando...";

    try {

        const respuesta = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(registro)

        });

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }

        const resultado = await respuesta.json();

        console.log("Respuesta de Google:", resultado);

        if (!resultado.ok) {
            throw new Error(resultado.mensaje);
        }

        // ÉXITO
        boton.textContent = "Guardado correctamente";

        alert(
            "Checklist guardado correctamente en Google Sheets."
        );

        return true;

    } catch (error) {

        console.error(
            "Error al enviar checklist:",
            error
        );

        // Permitimos intentar nuevamente
        boton.disabled = false;
        boton.textContent = "Reintentar envío";

        alert(
            "No se pudo guardar el checklist.\n\n" +
            "Los datos permanecen en pantalla para que puedas intentarlo nuevamente."
        );

        return false;
    }
}

// CERRAR MODAL

function cerrarModal() {

    document.getElementById("modalFondo").style.display =
        "none";

}


// NUEVO CHECKLIST

function nuevoChecklist() {

    for (const key in respuestas) {
        delete respuestas[key];
    }

    document
        .querySelectorAll(".radio")
        .forEach(elemento => {
            elemento.classList.remove("seleccionado");
        });

    document
        .querySelectorAll(".item")
        .forEach(elemento => {
            elemento.classList.remove("bien", "falla");
        });


    document.getElementById("placas").value = "";
    document.getElementById("kilometraje").value = "";
    document.getElementById("conductor").value = "";
    document.getElementById("observaciones").value = "";

    colocarFecha();
    actualizarProgreso();
    cerrarModal();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    const boton =
    document.getElementById("finalizar");

    boton.disabled = false;
    boton.textContent = "Finalizar inspección";
}
