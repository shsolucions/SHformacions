const DEFAULT_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '34660137163';

export const whatsappService = {
  openChat(message: string, number?: string): void {
    const phone = (number ?? DEFAULT_NUMBER).replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  openCourseRequest(courseName: string, number?: string): void {
    const message = `Hola! M'interessa el curs "${courseName}". Podríeu donar-me més informació?`;
    whatsappService.openChat(message, number);
  },

  openGeneral(customMessage?: string, number?: string): void {
    const message =
      customMessage ??
      "Hola! M'interessa més informació sobre els vostres cursos i serveis IT.";
    whatsappService.openChat(message, number);
  },
};
