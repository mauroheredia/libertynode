⚡ LibertyNode

**Automatización visual, local y soberana.**

> Dejá de pagar por automatizaciones. Construílas, poseelas y ejecutalas donde quieras.

LibertyNode es un editor visual de nodos ("No-Code" / "Low-Code") para crear flujos de trabajo y automatizaciones reales.
A diferencia de plataformas comerciales como Zapier o Make, LibertyNode **no ejecuta tu lógica en servidores ajenos ni te cobra por operación**.

En su lugar:
👉 Genera código JavaScript puro (`.js`)
👉 Lo ejecutás donde vos quieras
👉 Vos tenés el control total

**Tu código, tu soberanía, tus reglas.**

---

## 🧠 ¿Por qué existe LibertyNode?

Las herramientas actuales de automatización:

* cobran por cada acción
* bloquean funcionalidades detrás de planes pagos
* ejecutan tu lógica en servidores que no controlás

LibertyNode nace para cambiar eso.

> Automatización sin intermediarios. Sin límites artificiales. Sin dependencia.

---

## 🚀 Características Principales

* **Lienzo Infinito**
  Interfaz gráfica con zoom y paneo para construir desde flujos simples hasta sistemas complejos sin perderte.

* **Soberanía de Datos (BYOR)**
  *Bring Your Own Repo*. Guardá tus proyectos directamente en tu GitHub.
  👉 Nosotros no almacenamos tu código ni tus credenciales.

* **Compilador en Tiempo Real**
  Todo lo que conectás se transforma instantáneamente en JavaScript puro, optimizado y legible.

* **Módulos Comunitarios (Hot Reload)**
  Importá funcionalidades desde URLs raw de GitHub sin recargar la app.
  👉 Sin tiendas, sin aprobaciones, sin fricción.

* **Zero Dependencies**
  HTML, CSS y JS puro.
  Sin React. Sin NPM. Sin build steps.
  👉 Abrís y funciona.

---

## ⚡ Ejemplo de uso real

Imaginá esto:

1. Recibís un mensaje en Telegram
2. Lo procesás con IA
3. Guardás el resultado en Google Sheets

En LibertyNode lo armás visualmente conectando nodos.
Después:

👉 Generás el `.js`
👉 Lo corrés en tu servidor, PC o Raspberry Pi

Listo. Sin pagar por cada ejecución.

---

## 💻 ¿Cómo funciona?

1. **Armá tu lógica**
   Arrastrá triggers, actions y nodos de lógica al lienzo.

2. **Conectá los cables**
   Definí el flujo de datos visualmente.

3. **Generá el código**
   Click en `🚀 GENERAR CÓDIGO`.

4. **Desplegá donde quieras**
   Ejecutá el `.js` en Node.js, servidores, IoT o donde se te cante.

---

## 🧩 Creando Módulos Personalizados

LibertyNode está diseñado para ser expandido sin límites.

Podés crear tus propios módulos y compartirlos con el mundo.

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
        return `    console.log("${data.mensaje}");`;
    }
};

if (typeof UI !== 'undefined' && UI.addModuleToSidebar) {
    UI.addModuleToSidebar("mi_accion_custom");
}
```

Subís ese archivo a GitHub → pegás la URL raw → listo.

👉 Sistema de plugins sin marketplace. Sin permisos. Sin bloqueos.

---

## 📦 Módulos disponibles

* Google
  [https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/google.js](https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/google.js)

* Telegram
  [https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/telegram.js](https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/telegram.js)

* IA
  [https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/ia.js](https://raw.githubusercontent.com/mauroheredia/libertynodepacks/refs/heads/main/ia.js)

---

## 🛠️ Stack Tecnológico

* **Core Visual:** Vanilla JavaScript (ES6+), HTML5, CSS3
* **UI/UX:** Estilo Cyberpunk/Tech (Space Mono + Syne)
* **Auth:** Firebase Auth (solo como puente seguro con GitHub)

---

## 🧭 Roadmap (visión)

* [ ] Ejecución directa desde el navegador (sandbox runtime)
* [ ] Librería oficial de módulos (packs curados)
* [ ] Integración más profunda con IoT (ESP32, Arduino)
* [ ] Sistema de debugging visual
* [ ] Exportación a microservicios listos para deploy

---

## 🤝 Contribuir

LibertyNode es una plataforma abierta.

Podés:

* crear módulos
* mejorar el core
* proponer ideas

Hacé un fork y mandá PR 🚀

---

## 🌍 Filosofía

LibertyNode no es solo una herramienta.

Es una idea:

> El código que creás debería ser tuyo.
> La automatización debería ser libre.
> Y las herramientas no deberían limitarte para venderte upgrades.

---

## 🛡️ Licencia

MIT — usalo, modificalo, rompelo y volvelo a armar.

---

## ⚡ Empezá ahora

Cloná el repo, abrilo en el navegador y armá tu primer flujo.

Después ejecutalo donde quieras.

Sin cuentas. Sin límites. Sin pedir permiso.


