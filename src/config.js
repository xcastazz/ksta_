// Número de WhatsApp que recibe las cotizaciones (código de país + número, sin + ni espacios). Ej: 573001234567
export const WHATSAPP_NUMBER = '000000000';

// Asesorías por Microsoft Teams (hora de Colombia, UTC-5)
export const MEETING = {
  days: 10,                              // cuántos días hábiles hacia adelante se pueden agendar
  hours: [9, 10, 11, 14, 15, 16, 17],    // horas disponibles (24 h)
  workDays: [1, 2, 3, 4, 5],             // lunes a viernes
  durationMin: 30,
  minNoticeHours: 3,                     // anticipación mínima
};

// Enlace de tu reunión personal de Microsoft Teams (crea una reunión en Teams > Calendario > "Reunirse ahora" o
// una reunión recurrente, copia su enlace y pégalo aquí). Si lo dejas vacío, el panel genera una sala de Jitsi Meet.
export const TEAMS_LINK = '';
