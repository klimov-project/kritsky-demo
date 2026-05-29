export const useVariantPdf = () => {
  const toast = useToast();
  const { isDownloadingPdf, variant } = useVariantState();
  const answersText = useState<string>('answers-text', () => '');
  const answer2 = useState<string>('answer-2', () => '');

  const allTasks = [
    'task1',
    'task2',
    'task3',
    'task4_1',
    'task4_2',
    'task5',
    'task6',
    'task7',
    'task8',
    'task9_1',
    'task9_2',
    'task10',
    'task11_1',
    'task11_2',
    'task11_3',
    'task11_4',
    'task11_5',
  ];

  const getTaskNumber = (taskKey: string): string => {
    return taskKey.replace('task', '').replace(/_/g, '.');
  };

  const getAnswerForTask = (taskKey: string): string | null => {
    const taskData = variant.value?.[taskKey];
    if (!taskData) return null;

    // Определяем тип задания
    if (taskKey === 'task1') {
      return taskData.answer || null;
    }
    if (taskKey === 'task2') {
      // Для task2 ответ собирается из пар, нужна особая логика
      return answer2.value || null;
    }
    if (taskKey === 'task3' || taskKey === 'task6') {
      const answers = [taskData.answer1, taskData.answer2].filter(Boolean);
      return answers.length > 0 ? answers.join(', ') : null;
    }
    if (taskKey === 'task7') {
      return taskData.answer || null;
    }
    if (taskKey === 'task8') {
      const options = variant.value?.task8Options || [];
      const answers = options
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.term);
      return answers.length > 0 ? answers.join(', ') : null;
    }
    if (
      taskKey.startsWith('task4_') ||
      taskKey === 'task5' ||
      taskKey.startsWith('task9_') ||
      taskKey === 'task10' ||
      taskKey.startsWith('task11_')
    ) {
      // Задания без ответов
      return null;
    }

    // По умолчанию
    if (Array.isArray(taskData.answer)) {
      return taskData.answer.join(', ');
    }
    return taskData.answer || null;
  };

  const collectAllAnswers = () => {
    const lines: string[] = [];

    for (const taskKey of allTasks) {
      const answer = getAnswerForTask(taskKey);
      if (answer) {
        const taskNumber = getTaskNumber(taskKey);
        lines.push(`Задание ${taskNumber} - Ответ: ${answer} <br />`);
      }
    }

    // Сортируем по номеру задания
    lines.sort((a, b) => {
      const numA = parseFloat(a.match(/Задание ([\d.]+)/)?.[1] || '0');
      const numB = parseFloat(b.match(/Задание ([\d.]+)/)?.[1] || '0');
      return numA - numB;
    });

    answersText.value = lines.join('\n') + (lines.length > 0 ? '\n' : '');
  };

  const generatePdf = async (elementId: string = 'variant-content-pdf') => {
    if (import.meta.server) return;

    const ticketContainer = document.getElementById(elementId);
    isDownloadingPdf.value = true;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const fontUrl = '/font/MinionPro-Regular.ttf';
      const fontResponse = await fetch(fontUrl);
      const fontData = await fontResponse.arrayBuffer();
      const fontBase64 = btoa(
        new Uint8Array(fontData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          '',
        ),
      );

      if (!elementId) throw new Error('Container not found');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const headerHeight = 10;
      const footerHeight = 10;
      const contentWidth = pageWidth;
      const contentHeight = pageHeight - headerHeight - footerHeight;

      console.log('Page height:', pageHeight, 'mm');
      console.log('Content height:', contentHeight, 'mm');
      console.log('Header:', headerHeight, 'mm / Footer:', footerHeight, 'mm');

      const paginateSection = (
        sectionEl: HTMLElement,
        contentHeightPx: number,
      ) => {
        const pages: HTMLElement[][] = [];
        let currentPage: HTMLElement[] = [];
        let currentPageHeight = 0;
        const actualContentHeightPx = contentHeightPx - headerHeight * 8;
        const atoms = getAtomicBlocks(sectionEl);

        const topBuffer = document.createElement('div');
        topBuffer.style.height = `${headerHeight * 8}px`;
        topBuffer.style.width = '100%';
        topBuffer.style.background = 'green';
        topBuffer.style.visibility = 'hidden';
        currentPage.push(topBuffer);

        for (const atom of atoms) {
          const atomHeight = atom.offsetHeight + 16;

          if (currentPageHeight + atomHeight > actualContentHeightPx) {
            // По умолчанию оверфлоу = высоте контентной части
            let overflow = actualContentHeightPx;

            if (currentPage.length > 0) {
              if (atomHeight > actualContentHeightPx) {
                const freeForHeadSlice =
                  actualContentHeightPx - currentPageHeight - headerHeight * 8;
                const headWrapper = document.createElement('div');
                headWrapper.style.height = `${freeForHeadSlice}px`;
                headWrapper.style.width = '100%';
                headWrapper.style.overflow = 'hidden';
                headWrapper.style.position = 'relative';

                const clonedAtom1 = atom.cloneNode(true) as HTMLElement;
                clonedAtom1.style.position = 'relative';
                clonedAtom1.style.top = `0px`;

                headWrapper.appendChild(clonedAtom1);

                currentPage.push(headWrapper);
                currentPageHeight += atomHeight;
                overflow =
                  currentPageHeight -
                  actualContentHeightPx +
                  6 +
                  headerHeight * 8;
              }
              pages.push(currentPage);
            }

            if (atomHeight > actualContentHeightPx) {
              currentPage = [];
              currentPageHeight = 0;
              currentPage = [topBuffer];
              const tailWrapper = document.createElement('div');
              tailWrapper.style.height = `${overflow}px`;
              tailWrapper.style.width = '100%';
              tailWrapper.style.overflow = 'hidden';
              tailWrapper.style.position = 'relative';

              const clonedAtom2 = atom.cloneNode(true) as HTMLElement;
              clonedAtom2.style.position = 'relative';
              clonedAtom2.style.top = `-${atomHeight - overflow}px`;

              tailWrapper.appendChild(clonedAtom2);

              currentPage.push(tailWrapper);
            } else {
              currentPage = [topBuffer];
              currentPage.push(atom);
              currentPageHeight = atomHeight;
            }
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

      const renderSection = async (
        sectionEl: HTMLElement,
        sectionName: string,
      ) => {
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
            position: absolute !important;
            left: -9999px;
            top: 0;
            z-index: -1;
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
            opacity: 0.03;
            pointer-events: none;
          `;
          tempContainer.style.position = 'absolute';
          tempContainer.appendChild(watermark);

          for (const atom of pages[i]!) {
            tempContainer.appendChild(atom.cloneNode(true));
          }

          document.body.appendChild(tempContainer);

          const textElements = tempContainer.querySelectorAll(
            'div.task-instruction-wrapper, div.task-instruction-wrapper>p, span.task-number-pdf__number, p.task-pdf-text, p.task-pdf-text>p',
          );
          textElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.paddingTop = '0';
              el.style.marginTop = '0';
            }
          });

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
          pdf.addImage(imgData, 'PNG', 0, 0, contentWidth, pageHeight);
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
          10,
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

      toast.add({
        title: 'PDF скачан',
        description: 'Вариант успешно сохранен в PDF',
        color: 'success',
        icon: 'i-lucide-download',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Check console.');

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

  return {
    answersText,
    answer2,
    generatePdf,
    isDownloadingPdf,
    collectAllAnswers,
  };
};
