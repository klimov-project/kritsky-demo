/**
 * Composable for variant export functionality
 * Handles PDF generation, printing, and sharing
 */
import type { GeneratedVariant } from '@/types/generatedVariant';

export const useVariantExport = () => {
  const toast = useToast();
  const { isDownloadingPdf } = useVariantState();
  const variantsStore = useVariantsStore();
  const { isAuthenticated, openLoginModal } = useAuth();
  const config = useRuntimeConfig();

  /**
   * Generate PDF from variant using html2canvas and jsPDF
   */
  const downloadVariantPdf = async (elementId: string = 'variant-content') => {
    if (!import.meta.client) return;

    isDownloadingPdf.value = true;

    try {
      // Dynamic imports for client-side only
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Variant content element not found');
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `variant_${timestamp}.pdf`;

      pdf.save(filename);

      toast.add({
        title: 'PDF скачан',
        description: 'Вариант успешно сохранен в PDF',
        color: 'success',
        icon: 'i-lucide-download',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось создать PDF',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
    } finally {
      isDownloadingPdf.value = false;
    }
  };

  /**
   * Print variant using browser print dialog
   */
  const printVariant = (elementId: string = 'variant-content') => {
    if (!import.meta.client) return;

    const element = document.getElementById(elementId);
    if (!element) {
      toast.add({
        title: 'Ошибка',
        description: 'Содержимое варианта не найдено',
        color: 'error',
      });
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось открыть окно печати',
        color: 'error',
      });
      return;
    }

    // Get styles from current page
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Вариант ЕГЭ</title>
          <style>
            ${styles}
            @media print {
              body { 
                margin: 0; 
                padding: 20px;
                font-family: 'Times New Roman', serif;
              }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  /**
   * Save variant to user profile
   */
  const saveVariantToProfile = async (variant: GeneratedVariant) => {
    if (!isAuthenticated.value) {
      openLoginModal();
      return false;
    }

    try {
      await variantsStore.saveVariant(variant);
      toast.add({
        title: 'Сохранено',
        description: 'Вариант сохранен в ваш профиль',
        color: 'success',
        icon: 'i-lucide-bookmark-check',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось сохранить вариант',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
      return false;
    }
  };

  /**
   * Generate shareable link for variant
   */
  const generateShareableLink = async (variantId?: number) => {
    if (!import.meta.client) return null;

    // Generate a unique ID for the variant
    const shareId = variantId || `temp_${Date.now()}`;
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/variant/${shareId}`;

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      toast.add({
        title: 'Ссылка скопирована',
        description: 'Ссылка на вариант скопирована в буфер обмена',
        color: 'success',
        icon: 'i-lucide-link',
      });
      return shareLink;
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      toast.add({
        title: 'Ссылка создана',
        description: shareLink,
        color: 'info',
        icon: 'i-lucide-link',
      });
      return shareLink;
    }
  };

  /**
   * Share variant via Web Share API (mobile)
   */
  const shareVariant = async (variant: GeneratedVariant, variantId?: number) => {
    if (!import.meta.client) return;

    const title = variant.work?.title
      ? `Вариант ЕГЭ: ${variant.work.title}`
      : 'Вариант ЕГЭ по литературе';

    const shareId = variantId || `temp_${Date.now()}`;
    const shareUrl = `${window.location.origin}/variant/${shareId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: 'Посмотрите этот вариант ЕГЭ по литературе',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        await generateShareableLink(variantId);
      }
    } else {
      // Fallback to clipboard
      await generateShareableLink(variantId);
    }
  };

  return {
    downloadVariantPdf,
    printVariant,
    saveVariantToProfile,
    generateShareableLink,
    shareVariant,
    isDownloadingPdf: readonly(isDownloadingPdf),
  };
};
