export const useVariantPdf = () => {
  const { isDownloadingPdf } = useVariantState();

  const generatePdf = async (ticketContainer: HTMLElement) => {
    if (import.meta.server) return;

    isDownloadingPdf.value = true;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const fontUrl = '/font/MinionPro-Regular.ttf';
      const fontResponse = await fetch(fontUrl);
      const fontData = await fontResponse.arrayBuffer();
      const fontBase64 = btoa(
        new Uint8Array(fontData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          '',
        ),
      );

      if (!ticketContainer) throw new Error('Container not found');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const headerHeight = 14;
      const footerHeight = 14;
      const contentWidth = pageWidth;
      const contentHeight = pageHeight - headerHeight - footerHeight;

      console.log('Page height:', pageHeight, 'mm');
      console.log('Content height:', contentHeight, 'mm');
      console.log('Header:', headerHeight, 'mm / Footer:', footerHeight, 'mm');

      const paginateSection = (sectionEl: HTMLElement, contentHeightPx: number) => {
        const pages: HTMLElement[][] = [];
        let currentPage: HTMLElement[] = [];
        let currentPageHeight = 0;
        const atoms = getAtomicBlocks(sectionEl);

        for (const atom of atoms) {
          const atomHeight = atom.offsetHeight + 24;
          if (atomHeight > contentHeightPx) {
            if (currentPage.length > 0) {
              pages.push(currentPage);
              currentPage = [];
              currentPageHeight = 0;
            }
            pages.push([atom]);
            continue;
          }

          console.log(
            'currentPageHeight + atomHeight:',
            currentPageHeight,
            'px + ',
            atomHeight,
            'px',
          );
          console.log('Content px height:', contentHeightPx, 'px');

          if (currentPageHeight + atomHeight > contentHeightPx) {
            pages.push(currentPage);
            currentPage = [atom];
            currentPageHeight = atomHeight;
          } else {
            currentPage.push(atom);
            currentPageHeight += atomHeight;
          }
        }

        if (currentPage.length > 0) {
          pages.push(currentPage);
        }

        return pages;
      };

      const getAtomicBlocks = (container: HTMLElement): HTMLElement[] => {
        const atoms: HTMLElement[] = [];
        const children = Array.from(container.children);

        for (const child of children) {
          if (
            child.tagName === 'TABLE' ||
            child.tagName === 'H1' ||
            child.tagName === 'H2' ||
            child.tagName === 'H3' ||
            child.classList.contains('answer-item')
          ) {
            atoms.push(child as HTMLElement);
          } else {
            atoms.push(child as HTMLElement);
          }
        }

        return atoms;
      };

      const renderSection = async (sectionEl: HTMLElement, sectionName: string) => {
        const pxPerMm = sectionEl.scrollWidth / contentWidth;
        const contentHeightPx = contentHeight * pxPerMm;
        const pages = paginateSection(sectionEl, contentHeightPx);

        console.log(`Section "${sectionName}": ${pages.length} page(s)`);

        for (let i = 0; i < pages.length; i++) {
          const tempContainer = document.createElement('div');
          tempContainer.className = 'ticket-pdf-container';
          tempContainer.style.cssText = `
            width: ${sectionEl.scrollWidth}px;
            min-height: ${contentHeightPx}px;
            padding: 55px 55px 25px;
            position: absolute;
            left: -9999px;
            top: 0;
          `;

          const watermark = document.createElement('div');
          watermark.style.cssText = `
            position: absolute;
            z-index: 0;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('/periya-full-x2-compress.svg');
            background-repeat: repeat-y;
            background-size: 100% auto;
            background-position: center center;
            opacity: 0.05;
            pointer-events: none;
          `;
          tempContainer.style.position = 'absolute';
          tempContainer.appendChild(watermark);

          for (const atom of pages[i]!) {
            tempContainer.appendChild(atom.cloneNode(true));
          }

          document.body.appendChild(tempContainer);

          const canvas = await html2canvas(tempContainer, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: sectionEl.scrollWidth,
            height: Math.ceil(contentHeightPx),
          });

          document.body.removeChild(tempContainer);

          if (i > 0 || pdf.internal.pages.length > 1) {
            pdf.addPage();
          }

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, contentWidth, contentHeight);
        }
      };

      const sections = ticketContainer.querySelectorAll('.pdf-section');
      for (const section of sections) {
        const name = (section as HTMLElement).dataset.sectionName || 'unnamed';
        await renderSection(section as HTMLElement, name);
      }

      if (pdf.internal.pages.length > 1) {
        pdf.deletePage(1);
      }

      const totalPages = pdf.internal.pages.length - 1;
      console.log(`Total pages: ${totalPages}`);

      pdf.addFileToVFS('MinionPro-Regular.otf', fontBase64);
      pdf.addFont('MinionPro-Regular.otf', 'MinionPro', 'normal');
      pdf.setFont('MinionPro');

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Прозрачная заливка: setFillColor с альфа-каналом + reset GState
        pdf.setFillColor(255, 255, 255);
        (pdf.setGState as any)(new (pdf.GState as any)({ opacity: 0.01 }));
        pdf.rect(0, 0, pageWidth, headerHeight, 'F');
        pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
        (pdf.setGState as any)(new (pdf.GState as any)({ opacity: 1 }));

        pdf.setFontSize(10);
        pdf.setTextColor(180, 180, 180);

        pdf.text('Крицĸий - подготовĸа ĸ ЕГЭ', 15, 10);
        pdf.text(
          ` ${new Date(Date.now()).toLocaleDateString()} `,
          pageWidth - 15,
          12,
          { align: 'right' },
        );

        pdf.text(' ege.kritsky.academy', 15, pageHeight - 8);
        pdf.setFontSize(8);
        pdf.text(
          `страница ${i} / ${totalPages}`,
          pageWidth - 15,
          pageHeight - 8,
          {
            align: 'right',
          },
        );
      }

      pdf.save('variant-ege-literatura.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Check console.');
    } finally {
      isDownloadingPdf.value = false;
    }
  };

  return {
    generatePdf,
    isDownloadingPdf,
  };
};
