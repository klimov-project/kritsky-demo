import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      html2canvas,
      jsPDF,
    },
  };
});
