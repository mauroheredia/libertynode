/**
 * LIBERTYNODE - MEGAPACK DE EXPANSIÓN (v1.0)
 * Este archivo añade disparadores y acciones avanzadas.
 */

(function() {
    console.log("⚡ [MegaPack] Iniciando carga de módulos extendidos...");

    const nuevosModulos = {
        // --- DISPARADOR: MONITOREO DE ARCHIVOS ---
        "trigger_file": {
            id: "trigger_file",
            type: "trigger",
            title: "Carpeta Watcher",
            icon: "📁",
            color: "#10b981", // Verde Trigger
            inputs: 0,
            outputs: 1,
            fields: [
                { id: "path", label: "Ruta de carpeta", type: "text", placeholder: "C:/logs/servidor" }
            ],
            generateCode: (data) => {
                return `// 📁 Trigger: Monitoreo de carpeta ${data.path || './'}\nasync function ejecutarFlujo(fileData) {\n    console.log("Archivo detectado:", fileData.name);`;
            }
        },

        // --- DISPARADOR: RECIBIR EMAIL ---
        "trigger_email": {
            id: "trigger_email",
            type: "trigger",
            title: "Recibir Email",
            icon: "📬",
            color: "#10b981",
            inputs: 0,
            outputs: 1,
            fields: [
                { id: "address", label: "Casilla de correo", type: "text", placeholder: "alertas@tu-sistema.com" }
            ],
            generateCode: (data) => {
                return `// 📬 Trigger: Nuevo email en ${data.address}\nasync function ejecutarFlujo(emailData) {\n    console.log("Email recibido de:", emailData.from);`;
            }
        },

        // --- ACCIÓN: RESPONDER TELEGRAM ---
        "action_telegram_send": {
            id: "action_telegram_send",
            type: "action",
            title: "Telegram (Responder)",
            icon: "✈️",
            color: "#3b82f6", // Azul Acción
            inputs: 1,
            outputs: 1,
            fields: [
                { id: "botToken", label: "Bot Token", type: "password" },
                { id: "message", label: "Mensaje de respuesta", type: "textarea" }
            ],
            generateCode: (data) => {
                return `    // ✈️ Acción: Enviar respuesta por Telegram\n    await fetch("https://api.telegram.org/bot${data.botToken}/sendMessage", {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({ chat_id: eventoData.chatId, text: \`${data.message}\` })\n    });`;
            }
        }
    };

    // Registro Masivo
    Object.keys(nuevosModulos).forEach(id => {
        window.LibertyModules[id] = nuevosModulos[id];
        
        // Si la UI ya está cargada, los añadimos al sidebar al instante
        if (window.UI && typeof window.UI.addModuleToSidebar === 'function') {
            window.UI.addModuleToSidebar(id);
        }
    });

    console.log("✅ [MegaPack] Módulos inyectados con éxito.");
})();