/**
 * LIBERTYNODE - CORE MODULES
 * Aquí se definen los bloques (nodos) disponibles en la aplicación.
 * Para añadir un módulo nuevo de la comunidad, simplemente agregá un objeto a 'window.LibertyModules'.
 */

window.LibertyModules = {

    // ==========================================
    // CATEGORÍA: DISPARADORES (TRIGGERS)
    // ==========================================

    "trigger_webhook": {
        id: "trigger_webhook",
        type: "trigger",
        title: "Webhook API",
        icon: "📥",
        color: "var(--accent-green)",
        inputs: 0, // Los triggers no reciben cables de entrada
        outputs: 1, // Pasan la corriente al siguiente nodo
        fields: [
            { id: "endpoint", label: "Ruta / Evento", type: "text", placeholder: "ej: /nuevo_pago" }
        ],
        // generateCode recibe la 'data' que el usuario tipeó en la interfaz
        generateCode: (data) => {
            return `// 📥 Trigger: Webhook (${data.endpoint || '/'})
async function ejecutarFlujo(eventoData) {
    console.log("Iniciando flujo desde webhook...");
    // Las variables del evento estarán disponibles en el scope
`;
        }
    },

    "trigger_clock": {
        id: "trigger_clock",
        type: "trigger",
        title: "Reloj (Cron)",
        icon: "🕒",
        color: "var(--accent-green)",
        inputs: 0,
        outputs: 1,
        fields: [
            { id: "interval", label: "Intervalo (minutos)", type: "number", placeholder: "15" }
        ],
        generateCode: (data) => {
            return `// 🕒 Trigger: Reloj programado cada ${data.interval || '15'} minutos
async function ejecutarFlujo() {
    console.log("Ejecución por reloj iniciada...");
`;
        }
    },

    // ==========================================
    // CATEGORÍA: LÓGICA
    // ==========================================

    "logic_if": {
        id: "logic_if",
        type: "logic",
        title: "Condición SI/NO",
        icon: "⚖️",
        color: "var(--accent-yellow)",
        inputs: 1,
        outputs: 2, // Tiene dos salidas (True y False)
        fields: [
            { id: "var1", label: "Variable a evaluar", type: "text", placeholder: "eventoData.monto" },
            { id: "operator", label: "Operador", type: "select", options: ["==", "!=", ">", "<", ">=", "<="] },
            { id: "var2", label: "Valor de control", type: "text", placeholder: "1000" }
        ],
        generateCode: (data) => {
            // CORRECCIÓN: Usamos concatenación simple ('"' + ... + '"') para que el IDE no se maree
            let val2 = isNaN(data.var2) ? '"' + data.var2 + '"' : data.var2;
            
            return `    // ⚖️ Lógica: SI ${data.var1} ${data.operator} ${data.var2}
    if (${data.var1} ${data.operator} ${val2}) {
        console.log("Condición verdadera superada.");
        // --- INICIO CAMINO VERDADERO ---`;
        }
    },
    // ==========================================
    // CATEGORÍA: ACCIONES (OUTPUTS)
    // ==========================================

    "action_telegram": {
        id: "action_telegram",
        type: "action",
        title: "Enviar Telegram",
        icon: "✈️",
        color: "var(--accent-blue)",
        inputs: 1,
        outputs: 1,
        fields: [
            // type="password" oculta la key visualmente en la UI por privacidad
            { id: "botToken", label: "Bot Token API", type: "password", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" },
            { id: "chatId", label: "Chat ID", type: "text", placeholder: "-100123456789" },
            { id: "message", label: "Mensaje", type: "textarea", placeholder: "¡Hola! Se ejecutó la automatización." }
        ],
        generateCode: (data) => {
            return `    // ✈️ Acción: Enviar mensaje por Telegram
    try {
        const tgResponse = await fetch("https://api.telegram.org/bot${data.botToken}/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: "${data.chatId}",
                text: \`${data.message}\`
            })
        });
        console.log("Telegram enviado: ", await tgResponse.json());
    } catch (error) {
        console.error("Error enviando Telegram: ", error);
    }`;
        }
    },

    "action_fetch": {
        id: "action_fetch",
        type: "action",
        title: "Petición HTTP",
        icon: "🌐",
        color: "var(--accent-blue)",
        inputs: 1,
        outputs: 1,
        fields: [
            { id: "method", label: "Método", type: "select", options: ["GET", "POST", "PUT", "DELETE"] },
            { id: "url", label: "URL Destino", type: "text", placeholder: "https://api.mi-sitio.com/datos" },
            { id: "payload", label: "Cuerpo (JSON) - Opcional", type: "textarea", placeholder: '{"clave": "valor"}' }
        ],
        generateCode: (data) => {
            let bodyCode = (data.method !== "GET" && data.payload) 
                ? `\n            body: JSON.stringify(${data.payload})` 
                : "";
            
            return `    // 🌐 Acción: Petición HTTP (${data.method})
    try {
        const httpResponse = await fetch("${data.url}", {
            method: "${data.method}",
            headers: { "Content-Type": "application/json" }${bodyCode}
        });
        const httpData = await httpResponse.json();
        console.log("Respuesta HTTP: ", httpData);
    } catch (error) {
        console.error("Error en petición HTTP: ", error);
    }`;
        }
    }
}