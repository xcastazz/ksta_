// Número de WhatsApp que recibe las cotizaciones (código de país + número, sin + ni espacios). Ej: 573001234567
export const WHATSAPP_NUMBER = '000000000';

// Asesorías por Google Meet (hora de Colombia, UTC-5)
export const MEETING = {
  days: 10,                              // cuántos días hábiles hacia adelante se pueden agendar
  hours: [9, 10, 11, 14, 15, 16, 17],    // horas disponibles (24 h)
  workDays: [1, 2, 3, 4, 5],             // lunes a viernes
  durationMin: 30,
  minNoticeHours: 3,                     // anticipación mínima
};

// Enlace fijo de Google Meet para las asesorías (opcional).
// Créalo una vez: Google Calendar > nuevo evento recurrente "Asesorías KstaStudio_" > Agregar videoconferencia de Google Meet,
// copia el enlace (meet.google.com/xxx-xxxx-xxx) y pégalo aquí. Con él, "Generar reunión" asigna el enlace al instante.
// Si lo dejas vacío, "Generar reunión" abre Google Calendar con el evento listo y el cliente invitado.
export const MEET_LINK = '';
