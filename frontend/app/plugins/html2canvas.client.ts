import html2canvas from 'html2canvas';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      html2canvas,
    },
  };
});
