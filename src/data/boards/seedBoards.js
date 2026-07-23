const accessibility = title => ({
  ariaLabel: `Tablero de ${title.toLocaleLowerCase("es")}`,
  plainLanguageDescription: `Opciones de comunicación relacionadas con ${title.toLocaleLowerCase("es")}.`,
  readingOrder: "left-to-right-top-to-bottom",
  minimumTouchTargetPx: 48,
  supportsKeyboardNavigation: true,
  supportsScreenReader: true,
  supportsSwitchScanning: true,
  contrastRequirement: "WCAG_2_2_AA",
  allowFontScaling: true
});

const mainDefinitions = [
  ["board-basic-needs", "necesidades-basicas-inmediatas", "Necesidades básicas inmediatas", "Pedir agua, comida, baño, descanso, comodidad o ayuda.", "high", ["request", "ask-for-help", "inform"], [
    ["alimentacion-e-hidratacion", "Alimentación e hidratación", ["agua", "sed", "comida", "hambre", "beber", "comer", "ayuda para comer", "no puedo tragar"]],
    ["bano-e-higiene", "Baño e higiene", ["baño", "baño accesible", "orinar", "lavar manos", "higiene", "privacidad"]],
    ["descanso-y-confort", "Descanso y confort", ["descansar", "dormir", "cansancio", "silencio", "cama", "almohada"]],
    ["temperatura-y-ambiente", "Temperatura y ambiente", ["frío", "calor", "cobija", "ventilador", "luz", "ruido"]],
    ["posicion-corporal", "Posición corporal", ["sentarse", "acostarse", "levantarse", "cambiar posición", "silla de ruedas"]],
    ["ayuda-inmediata", "Ayuda inmediata", ["ayuda", "apoyo", "familiar", "cuidador", "urgente", "no puedo"]]
  ]],
  ["board-medical-care", "atencion-medica", "Atención médica", "Comunicar necesidades durante consulta, valoración, tratamiento y seguimiento médico.", "high", ["inform", "request", "ask-for-help", "consent"], [
    ["personal-medico", "Personal médico", ["médico", "médica", "enfermera", "enfermero", "especialista", "terapeuta"]],
    ["consulta-valoracion", "Consulta y valoración", ["consulta", "revisión", "exploración", "diagnóstico", "signos vitales", "estudios"]],
    ["tratamiento-indicaciones", "Tratamiento e indicaciones", ["tratamiento", "indicaciones", "receta", "dosis", "terapia", "reposo"]],
    ["procedimientos-medicos", "Procedimientos médicos", ["inyección", "curación", "muestra", "análisis", "radiografía", "ultrasonido"]],
    ["hospitalizacion-cuidados", "Hospitalización y cuidados", ["hospital", "cama", "habitación", "alta médica", "acompañante", "cuidados"]],
    ["comunicacion-con-personal", "Comunicación con el personal", ["no entiendo", "explíqueme", "más despacio", "repetir", "intérprete", "pregunta"]],
    ["seguimiento-medico", "Seguimiento médico", ["próxima cita", "resultado", "seguimiento", "mejoría", "empeoró", "referencia"]]
  ]],
  ["board-pain-symptoms", "dolor-sintomas-malestar", "Dolor, síntomas y malestar", "Comunicar dolor, síntomas, medicamentos, alergias y malestar emocional.", "high", ["inform", "ask-for-help", "alert"], [
    ["ubicacion-del-dolor", "Ubicación del dolor", ["cabeza", "cuello", "pecho", "espalda", "brazo", "abdomen", "estómago", "pierna", "garganta"]],
    ["intensidad-del-dolor", "Intensidad del dolor", ["no duele", "dolor leve", "dolor moderado", "dolor fuerte", "escala del dolor"]],
    ["sintomas-generales", "Síntomas generales", ["fiebre", "mareo", "náusea", "vómito", "diarrea", "tos", "cansancio"]],
    ["respiracion-signos-alarma", "Respiración y signos de alarma", ["falta de aire", "dolor de pecho", "ahogo", "desmayo", "convulsión", "sangrado"]],
    ["salud-digestiva-urinaria", "Salud digestiva y urinaria", ["estreñimiento", "diarrea", "dolor de estómago", "orina", "ardor al orinar"]],
    ["medicamentos-alergias", "Medicamentos y alergias", ["medicamento", "receta", "dosis", "alergia", "me hace daño"]],
    ["estado-emocional-asociado", "Estado emocional asociado", ["ansiedad", "miedo", "tristeza", "confusión", "necesito calmarme"]]
  ]],
  ["board-emergency", "emergencia-seguridad", "Emergencia y seguridad", "Comunicación rápida ante riesgos, accidentes, evacuación o desorientación.", "critical", ["alert", "ask-for-help", "inform"], [
    ["emergencia-medica", "Emergencia médica", ["ambulancia", "médico", "enfermera", "desmayo", "convulsión", "sangrado"]],
    ["caida-accidente-lesion", "Caída, accidente o lesión", ["me caí", "golpe", "fractura", "herida", "no puedo moverme"]],
    ["evacuacion-proteccion-civil", "Evacuación y protección civil", ["sismo", "incendio", "evacuar", "salida de emergencia", "punto de reunión"]],
    ["violencia-riesgo-personal", "Violencia o riesgo personal", ["miedo", "amenaza", "abuso", "me lastimaron", "policía"]],
    ["extravio-desorientacion", "Extravío o desorientación", ["perdido", "no sé dónde estoy", "familia", "orientación", "acompáñame"]],
    ["transporte-traslado-seguro", "Transporte y traslado seguro", ["rampa", "cinturón", "subir", "bajar", "silla de ruedas", "no empujar"]],
    ["comunicacion-critica-rapida", "Comunicación crítica rápida", ["sí", "no", "alto", "espera", "ayuda", "peligro", "no entiendo", "911"]]
  ]],
  ["board-institutional-services", "tramites-atencion-institucional", "Trámites y atención institucional", "Orientación, citas, documentos, pagos, derechos y accesibilidad.", "medium", ["request", "orientation", "complaint", "follow-up"], [
    ["recepcion-orientacion", "Recepción y orientación", ["información", "orientación", "módulo", "dónde está", "turno", "cita"]],
    ["citas-agenda", "Citas y agenda", ["sacar cita", "cambiar cita", "cancelar cita", "fecha", "hora", "esperar"]],
    ["documentos-requisitos", "Documentos y requisitos", ["identificación", "CURP", "comprobante", "expediente", "formato", "copia", "firma"]],
    ["registro-actualizacion-datos", "Registro y actualización de datos", ["nombre", "edad", "domicilio", "teléfono", "contacto de emergencia", "discapacidad"]],
    ["quejas-aclaraciones-seguimiento", "Quejas, aclaraciones y seguimiento", ["queja", "aclaración", "seguimiento", "folio", "respuesta", "no estoy de acuerdo"]],
    ["pagos-comprobantes", "Pagos y comprobantes", ["pagar", "recibo", "comprobante", "adeudo", "devolución", "factura", "costo"]],
    ["derechos-consentimiento-privacidad", "Derechos, consentimiento y privacidad", ["acepto", "no acepto", "no entiendo", "explicación", "privacidad", "acompañante"]],
    ["apoyos-accesibilidad", "Apoyos de accesibilidad", ["intérprete", "lectura fácil", "lector de pantalla", "rampa", "elevador", "baño accesible"]],
    ["resultado-tramite", "Resultado del trámite", ["aprobado", "rechazado", "pendiente", "falta documento", "finalizado", "en revisión"]]
  ]]
];

const now = "2026-06-19T00:00:00.000Z";
export const seedBoards = mainDefinitions.flatMap(([id, slug, title, description, urgencyLevel, communicationIntent, children], mainIndex) => {
  const main = {
    id, slug, title, description, parentId: null, level: "main",
    context: slug.includes("tramites") ? ["administrative", "institutional", "public-service"] : slug.includes("emergencia") ? ["emergency", "hospital", "public-service"] : ["medical", "hospital", "clinic", "home"],
    communicationIntent, urgencyLevel,
    semanticKeywords: children.flatMap(child => child[2]).slice(0, 18),
    naturalPhrases: children.flatMap(child => child[2].slice(0, 2)).slice(0, 8),
    accessibility: accessibility(title), sortOrder: mainIndex + 1,
    isDefault: true, isInstitutional: true, createdAt: now, updatedAt: now
  };
  return [main, ...children.map(([childSlug, childTitle, keywords], childIndex) => ({
    id: `subboard-${childSlug}`, slug: childSlug, title: childTitle,
    description: `Subtablero para comunicar: ${keywords.slice(0, 5).join(", ")}.`,
    parentId: id, level: "subboard", context: main.context, communicationIntent,
    urgencyLevel, semanticKeywords: keywords, naturalPhrases: keywords.map(term => `Necesito comunicar ${term}`),
    accessibility: accessibility(childTitle), sortOrder: childIndex + 1,
    isDefault: true, isInstitutional: true, createdAt: now, updatedAt: now,
    requiresManualReview: ["critical"].includes(urgencyLevel) || /medicamentos|alarma|violencia|consentimiento|derechos/.test(childSlug),
    reviewReason: /medicamentos|alarma|violencia|consentimiento|derechos/.test(childSlug) ? "Contenido sensible que requiere validación institucional." : urgencyLevel === "critical" ? "Contenido de emergencia que requiere validación humana." : ""
  }))];
});

export const mainBoards = seedBoards.filter(board => board.level === "main");
export const childrenOf = parentId => seedBoards.filter(board => board.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
