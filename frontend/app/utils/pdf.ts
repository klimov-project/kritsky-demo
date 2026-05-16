/**
 * Converts oklch() colors to rgb() or hex for html2canvas compatibility
 */
export const fixOklchColors = (element: HTMLElement) => {
  const allElements = element.querySelectorAll('*');
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;

    if (color.includes('oklch')) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      el.style.color = ctx.fillStyle;
    }

    if (backgroundColor.includes('oklch')) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = backgroundColor;
      el.style.backgroundColor = ctx.fillStyle;
    }
  });
};

export const fixOklchInStyles = (element: HTMLElement) => {
  const style = document.createElement('style');
  style.textContent = `
    * {
      color: ${
        window.getComputedStyle(document.documentElement).color
      } !important;
      background-color: ${
        window.getComputedStyle(document.documentElement).backgroundColor
      } !important;
    }
  `;
  element.appendChild(style);
  setTimeout(() => element.removeChild(style), 15000);
};
