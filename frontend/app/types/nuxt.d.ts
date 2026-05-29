declare module '#app' {
  interface NuxtApp {
    $html2canvas: typeof import('html2canvas').default;
    $jsPDF: typeof import('jspdf').jsPDF;
  }
}

export {};
