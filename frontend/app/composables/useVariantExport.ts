/**
 * Composable for variant export functionality
 * Handles PDF generation, printing, and sharing
 */
import type { GeneratedVariant } from '@/types/generatedVariant';

export const useVariantExport = () => {
  const toast = useToast();
  const { variant, isDownloadingPdf } = useVariantState();
  const { isAuthenticated, openLoginModal } = useAuth();
  const variantsStore = useVariantsStore();

  /**
   * Print variant using browser print dialog
   */
  const printVariant = (elementId: string = 'variant-content-pdf') => {
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
          <title>Вариант ЕГЭ | ege.kritsky.academy </title>
          <style>
            ${styles}
            @media print {
              body { 
                margin: 0; 
                padding: 20px; 
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
  const saveVariantToProfile = async () => {
    if (!isAuthenticated.value) {
      openLoginModal();
      return false;
    }

    if (!variant.value) return;

    try {
      await variantsStore.saveVariant(variant.value);
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
  const shareVariant = async (
    variant: GeneratedVariant,
    variantId?: number,
  ) => {
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
    printVariant,
    saveVariantToProfile,
    generateShareableLink,
    shareVariant,
    isDownloadingPdf: readonly(isDownloadingPdf),
  };
};
