import { HTML2CANVAS_CDN, JSPDF_CDN } from '@/consts/lib/pdfDownload';

type Html2CanvasFn = (
    element: HTMLElement,
    options?: {
        backgroundColor?: string | null;
        scale?: number;
        useCORS?: boolean;
        logging?: boolean;
        scrollX?: number;
        scrollY?: number;
        windowWidth?: number;
        windowHeight?: number;
        onclone?: (clonedDoc: Document) => void;
    },
) => Promise<HTMLCanvasElement>;

type JsPdfInstance = {
    internal: {
        pageSize: {
            getWidth: () => number;
            getHeight: () => number;
        };
    };
    addImage: (
        imageData: string,
        format: 'PNG' | 'JPEG',
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    addPage: () => void;
    save: (fileName: string) => void;
};

type JsPdfCtor = new (
    orientation: 'p' | 'l',
    unit: 'mm' | 'pt' | 'px',
    format: 'a4' | [number, number],
) => JsPdfInstance;

declare global {
    interface Window {
        html2canvas?: Html2CanvasFn;
        jspdf?: {
            jsPDF?: JsPdfCtor;
        };
    }
}

type DownloadElementPdfOptions = {
    element: HTMLElement;
    fileName: string;
    hideSelectors?: string[];
    marginMm?: number;
    scale?: number;
};

const scriptLoadingMap = new Map<string, Promise<void>>();

const loadScriptOnce = (src: string): Promise<void> => {
    const existingPromise = scriptLoadingMap.get(src);
    if (existingPromise) {
        return existingPromise;
    }

    const promise = new Promise<void>((resolve, reject) => {
        if (typeof document === 'undefined') {
            reject(new Error('Скачивание PDF доступно только в браузере.'));
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }

            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error(`Не удалось загрузить ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.loaded = 'false';
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', () => {
            reject(new Error(`Не удалось загрузить ${src}`));
        }, { once: true });

        document.head.appendChild(script);
    });

    scriptLoadingMap.set(src, promise);
    return promise;
};

const sanitizeFileName = (value: string): string => {
    const trimmed = value.trim() || 'variant';
    const normalized = trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
    return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
};

const hideElements = (root: HTMLElement, selectors: string[]) => {
    const snapshot: Array<{ element: HTMLElement; display: string; visibility: string }> = [];
    selectors.forEach((selector) => {
        root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
            snapshot.push({
                element,
                display: element.style.display,
                visibility: element.style.visibility,
            });
            element.style.display = 'none';
            element.style.visibility = 'hidden';
        });
    });
    return snapshot;
};

const restoreHiddenElements = (snapshot: Array<{ element: HTMLElement; display: string; visibility: string }>) => {
    snapshot.forEach((item) => {
        item.element.style.display = item.display;
        item.element.style.visibility = item.visibility;
    });
};

const loadPdfLibs = async () => {
    await loadScriptOnce(HTML2CANVAS_CDN);
    await loadScriptOnce(JSPDF_CDN);

    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF;

    if (!html2canvas || !jsPDF) {
        throw new Error('Не удалось инициализировать библиотеки для PDF.');
    }

    return { html2canvas, jsPDF };
};

export const downloadElementAsPdf = async ({
    element,
    fileName,
    hideSelectors = ['.no-print'],
    marginMm = 8,
    scale = 2,
}: DownloadElementPdfOptions) => {
    const { html2canvas, jsPDF } = await loadPdfLibs();
    const hiddenSnapshot = hideElements(element, hideSelectors);

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight,
            onclone: (clonedDoc) => {
                const elements = clonedDoc.getElementsByTagName('*');
                const cvs = clonedDoc.createElement('canvas');
                cvs.width = 1;
                cvs.height = 1;
                const ctx = cvs.getContext('2d');
                if (!ctx) return;

                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    if (!el.style) continue;

                    const computedStyle = window.getComputedStyle(el);
                    
                    // html2canvas fails on oklch() colors. We convert them to hex/rgb via canvas.
                    const fixColor = (color: string) => {
                        if (!color || !color.includes('oklch')) return color;
                        try {
                            ctx.fillStyle = color;
                            return ctx.fillStyle;
                        } catch {
                            return color;
                        }
                    };

                    const styleProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor'];
                    styleProps.forEach(prop => {
                        const val = computedStyle.getPropertyValue(prop);
                        if (val && val.includes('oklch')) {
                            el.style.setProperty(prop, fixColor(val), 'important');
                        }
                    });
                }
            }
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidthMm = pdf.internal.pageSize.getWidth();
        const pageHeightMm = pdf.internal.pageSize.getHeight();
        const contentWidthMm = pageWidthMm - marginMm * 2;
        const contentHeightMm = pageHeightMm - marginMm * 2;

        const pixelsPerMm = canvas.width / contentWidthMm;
        const pageHeightPx = Math.floor(contentHeightMm * pixelsPerMm);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx;
        const context = pageCanvas.getContext('2d');

        if (!context) {
            throw new Error('Не удалось подготовить холст для PDF.');
        }

        let renderedOffsetPx = 0;
        let pageIndex = 0;

        while (renderedOffsetPx < canvas.height) {
            const remainingPx = canvas.height - renderedOffsetPx;
            const sliceHeightPx = Math.min(pageHeightPx, remainingPx);

            pageCanvas.height = sliceHeightPx;
            context.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
            context.drawImage(
                canvas,
                0,
                renderedOffsetPx,
                canvas.width,
                sliceHeightPx,
                0,
                0,
                pageCanvas.width,
                sliceHeightPx,
            );

            const imageData = pageCanvas.toDataURL('image/jpeg', 0.98);
            const imageHeightMm = sliceHeightPx / pixelsPerMm;

            if (pageIndex > 0) {
                pdf.addPage();
            }
            pdf.addImage(imageData, 'JPEG', marginMm, marginMm, contentWidthMm, imageHeightMm);

            renderedOffsetPx += sliceHeightPx;
            pageIndex += 1;
        }

        pdf.save(sanitizeFileName(fileName));
    } finally {
        restoreHiddenElements(hiddenSnapshot);
    }
};
