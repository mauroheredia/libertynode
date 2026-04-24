# libertynode
LibertyNode: Entorno de automatización visual y soberano. Crea flujos de trabajo basados en nodos, guarda en tu propio repositorio y exporta código JavaScript puro listo para producción. .
# ⚡ LibertyNode

**Automatización visual, local y soberana.**

LibertyNode es un editor visual de nodos ("No-Code" / "Low-Code") diseñado para construir flujos de trabajo y automatizaciones. A diferencia de plataformas comerciales (como Make o Zapier), LibertyNode no ejecuta tu lógica en servidores ajenos ni te cobra por "operaciones". Genera código JavaScript puro (`.js`) que puedes ejecutar en tu propia máquina, servidor o microcontrolador.

**Tu código, tu soberanía, tus reglas.**

---

## 🚀 Características Principales

* **Lienzo Infinito:** Interfaz gráfica avanzada con soporte para Zoom y Paneo, diseñada para construir desde flujos simples hasta redes neuronales complejas sin perderte.
* **Soberanía de Datos (BYOR):** *Bring Your Own Repo*. Inicia sesión con GitHub y guarda tus proyectos directamente en tu propia cuenta. Nosotros no almacenamos ni tu código ni tus credenciales.
* **Compilador en Tiempo Real:** No hay cajas negras. Todo lo que conectas visualmente se compila instantáneamente en código Vanilla JavaScript altamente optimizado y legible.
* **Módulos Comunitarios (Hot Reload):** Expande el sistema inyectando "Packs de Expansión" directamente desde URLs crudas de GitHub (Raw URLs) sin necesidad de recargar la página ni tocar el código fuente.
* **Zero Dependencies:** Construido con HTML, CSS y JS puro. Sin React, sin NPM, sin dolores de cabeza. Funciona directamente en el navegador.

---

## 🛠️ Stack Tecnológico

* **Core Visual:** Vanilla JavaScript (ES6+), HTML5, CSS3.
* **Tipografía & UI:** Diseño inspirado en entornos Cyberpunk/Tech, utilizando *Space Mono* y *Syne*.
* **Autenticación:** Firebase Auth (Exclusivo para puenteo seguro con el token de GitHub).

---

## 💻 ¿Cómo funciona?

1.  **Armá tu lógica:** Arrastra disparadores (Triggers), acciones (Actions) y nodos de lógica (Logic) al espacio de trabajo.
2.  **Conectá los cables:** Dibuja las conexiones para definir el flujo de los datos.
3.  **Generá el código:** Haz clic en `🚀 GENERAR CÓDIGO`.
4.  **Despliega donde quieras:** Descarga el archivo `.js` generado. Puedes correrlo con Node.js en un servidor local, una Raspberry Pi, o incrustarlo en tus proyectos IoT (ESP32/Arduino con soporte JS).

---

## 🧩 Creando Módulos Personalizados

LibertyNode está diseñado para ser expandido. Cualquier desarrollador puede crear un módulo y compartirlo. Solo necesitas definir un objeto y agregarlo a `window.LibertyModules`.

**Ejemplo de Módulo Básico:**
```javascript
window.LibertyModules["mi_accion_custom"] = {
    id: "mi_accion_custom",
    type: "action",
    title: "Mi Bloque",
    icon: "⚙️",
    color: "var(--accent-blue)",
    inputs: 1, 
    outputs: 1,
    fields: [
        { id: "mensaje", label: "Texto a mostrar", type: "text" }
    ],
    generateCode: (data) => {
        return `    // Acción personalizada ejecutada\n    console.log("${data.mensaje}");`;
    }
};

// Si la UI está lista, lo añadimos a la barra lateral:
if (typeof UI !== 'undefined' && UI.addModuleToSidebar) {
    UI.addModuleToSidebar("mi_accion_custom");
}
Guarda este código en un .js, súbelo a un repositorio público y pégalo en el importador de LibertyNode o subilo de manera local.

🤝 Contribuir
Si tienes ideas para nuevos "Packs Oficiales" (ej. Telegram, Firebase, APIs Médicas, Arduino), siéntete libre de hacer un Fork del proyecto y enviar un Pull Request.

🛡️ Licencia
Distribuido bajo la Licencia MIT. Siéntete libre de usarlo, modificarlo y romperlo. (Ver el archivo LICENSE para más detalles).


