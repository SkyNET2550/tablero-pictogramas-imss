import { mainBoards } from "./seedBoards.js";

export const semanticBoardDictionary = Object.fromEntries(mainBoards.map(board => [board.slug, {
  keywords: board.semanticKeywords,
  phrases: board.naturalPhrases,
  related: board.slug === "necesidades-basicas-inmediatas" ? ["cuidado personal", "autonomía", "asistencia", "bienestar"]
    : board.slug === "dolor-sintomas-malestar" ? ["consulta médica", "urgencias", "enfermedad", "tratamiento"]
    : board.slug === "emergencia-seguridad" ? ["protección civil", "riesgo", "rescate", "alerta"]
    : ["ventanilla", "atención ciudadana", "servicio público", "derechos", "accesibilidad"]
}]));
