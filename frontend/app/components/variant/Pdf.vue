<script setup>
const ticketContainer = ref(null);
const isGenerating = ref(false);

const generatePdf = async () => {
  if (import.meta.server) return;

  isGenerating.value = true;

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

    const element = ticketContainer.value;
    if (!element) throw new Error('Container not found');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const headerHeight = 14;
    const footerHeight = 14;
    const contentWidth = pageWidth;
    const contentHeight = pageHeight - headerHeight - footerHeight; //  компенсация возможных погрешностей при рендеринге

    console.log('Page height:', pageHeight, 'mm');
    console.log('Content height:', contentHeight, 'mm');
    console.log('Header:', headerHeight, 'mm / Footer:', footerHeight, 'mm');

    const paginateSection = (sectionEl, contentHeightPx) => {
      const pages = [];
      let currentPage = [];
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

    const getAtomicBlocks = (container) => {
      const atoms = [];
      const children = Array.from(container.children);
      for (const child of children) {
        if (
          child.tagName === 'TABLE' ||
          child.tagName === 'H1' ||
          child.tagName === 'H2' ||
          child.tagName === 'H3' ||
          child.classList.contains('answer-item')
        ) {
          atoms.push(child);
        } else {
          atoms.push(child);
        }
      }
      return atoms;
    };

    const renderSection = async (sectionEl, sectionName) => {
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

        for (const atom of pages[i]) {
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

    const sections = element.querySelectorAll('.pdf-section');
    for (const section of sections) {
      const name = section.dataset.sectionName || 'unnamed';
      await renderSection(section, name);
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
      pdf.setGState(new pdf.GState({ opacity: 0.01 }));
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');
      pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
      pdf.setGState(new pdf.GState({ opacity: 1 }));

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
    isGenerating.value = false;
  }
};
</script>

<template>
  <div ref="ticketContainer" class="ticket-pdf-container">
    <div class="watermark-background"></div>

    <!-- Основной контент -->
    <div class="content-wrapper">
      <!-- Секция 1: Отрывок -->
      <div class="pdf-section two-page-excerpt" data-section-name="excerpt">
        <h1>Вариант 1</h1>
        <h2>Часть 1</h2>

        <p class="ticket-pdf__task-description">
          <strong>
            Прочитайте приведённый ниже фрагмент художественного произведения и
            выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.
          </strong>
        </p>

        <p>
          Но когда я приехала, то узнала, что уж побили их ваши... и что он в
          плену, недалеко в деревне.
        </p>
        <p>
          «Значит, — подумала я, — не увижу уже его больше!» А видеть хотелось.
          Ну, стала стараться увидать... Нищей оделась, хромой, и пошла, завязав
          лицо, в ту деревню, где был он. Везде казаки и солдаты... дорого мне
          стоило быть там! Узнала я, где поляки сидят, и вижу, что трудно
          попасть туда. А нужно мне это было. И вот ночью подползла я к тому
          месту, где они были. Ползу по огороду между гряд и вижу: часовой стоит
          на моей дороге... А уж слышно мне — поют поляки и говорят громко. Поют
          песню одну... к матери бога... И тот там же поёт... Аркадэк мой. Мне
          горько стало, как подумала я, что раньше за мной ползали... а вот оно,
          пришло время — и я за человеком поползла змеёй по земле и, может, на
          смерть свою ползу. А этот часовой уже слушает, выгнулся вперёд. Ну,
          что же мне? Встала я с земли и пошла на него. Ни ножа у меня нет,
          ничего, кроме рук да языка. Жалею, что не взяла ножа. Шепчу:
          «Погоди!..» А он, солдат этот, уже приставил к горлу мне штык. Я
          говорю ему шёпотом: «Не коли, погоди, послушай, коли у тебя душа есть!
          Не могу тебе ничего дать, а прошу тебя...» Он опустил ружье и также
          шёпотом говорит мне: «Пошла прочь, баба! пошла! Чего тебе?» Я сказала
          ему, что сын у меня тут заперт... «Ты понимаешь, солдат, — сын! Ты
          ведь тоже чей-нибудь сын, да? Так вот посмотри на меня — у меня есть
          такой же, как ты, и вон он где! Дай мне посмотреть на него, может, он
          умрёт скоро... и, может, тебя завтра убьют... будет плакать твоя мать
          о тебе? И ведь тяжко будет тебе умереть, не взглянув на неё, твою
          мать? И моему сыну тяжко же. Пожалей же себя и его, и меня — мать!..»
        </p>
        <p>
          Ох, как долго говорила я ему! Шёл дождь и мочил нас. Ветер выл и
          ревел, и толкал меня то в спину, то в грудь. Я стояла и качалась перед
          этим каменным солдатом... А он всё говорил: «Нет!» И каждый раз, как я
          слышала его холодное слово, ещё жарче во мне вспыхивало желание видеть
          того, Аркадэка... Я говорила и мерила глазами солдата — он был
          маленький, сухой и всё кашлял. И вот я упала на землю перед ним и,
          охватив его колени, всё упрашивая его горячими словами, свалила
          солдата на землю. Он упал в грязь. Тогда я быстро повернула его лицом
          к земле и придавила его голову в лужу, чтоб он не кричал. Он не
          кричал, а только всё барахтался, стараясь сбросить меня с своей спины.
          Я же обеими руками втискивала его голову глубже в грязь. Он и
          задохнулся... Тогда я бросилась к амбару, где пели поляки.
          «Аркадэк!..» — шептала я в щели стен. Они догадливые, эти поляки, — и,
          услыхав меня, не перестали петь! Вот его глаза против моих. «Можешь ты
          выйти отсюда?» — «Да, через пол!» — сказал он. «Ну, иди же». И вот
          четверо их вылезло из-под этого амбара: трое и Аркадэк мой. «Где
          часовые?» — спросил Аркадэк. «Вон лежит!..» И они пошли тихо-тихо,
          согнувшись к земле. Дождь шёл, ветер выл громко. Мы ушли из деревни и
          долго молча шли лесом. Быстро так шли. Аркадэк держал меня за руку, и
          его рука была горяча и дрожала. О!.. Мне так хорошо было с ним, пока
          он молчал. Последние это были минуты — хорошие минуты моей жадной
          жизни. Но вот мы вышли на луг и остановились. Они благодарили меня все
          четверо. Ох, как они долго и много говорили мне что-то! Я всё слушала
          и смотрела на своего пана. Что же он сделает мне? И вот он обнял меня
          и сказал так важно... Не помню, что он сказал, но так выходило, что
          теперь он в благодарность за то, что я увела его, будет любить меня...
          И стал он на колени предо мной, улыбаясь, и сказал мне: «Моя
          королева!» Вот какая лживая собака была это!.. Ну, тогда я дала ему
          пинка ногой и ударила бы его в лицо, да он отшатнулся и вскочил.
          Грозный и бледный стоит он предо мной... Стоят и те трое, хмурые все.
          И все молчат. Я посмотрела на них... Мне тогда стало — помню — только
          скучно очень, и такая лень напала на меня... Я сказала им: «Идите!»
          Они, псы, спросили меня: «Ты воротишься туда, указать наш путь?» Вот
          какие подлые! Ну, всё-таки ушли они. Тогда и я пошла... А на другой
          день взяли меня ваши, но скоро отпустили. Тогда увидела я, что пора
          мне завести гнездо, будет жить кукушкой! Уж тяжела стала я, и ослабели
          крылья, и перья потускнели... Пора, пора! Тогда я уехала в Галицию, а
          оттуда в Добруджу. И вот уже около трёх десятков лет живу здесь. Был у
          меня муж, молдаванин; умер с год тому времени. И живу я вот! Одна
          живу... Нет, не одна, а вон с теми.
        </p>
        <p>
          Старуха махнула рукой к морю. Там всё было тихо. Иногда рождался
          какой-то краткий, обманчивый звук и умирал тотчас же.
        </p>
        <p>
          — Любят они меня. Много я рассказываю им разного. Им это надо. Ещё
          молодые все... И мне хорошо с ними. Смотрю и думаю: «Вот и я, было
          время, такая же была... Только тогда, в моё время, больше было в
          человеке силы и огня, и оттого жилось веселее и лучше... Да!..»
        </p>
        <p style="text-align: right; margin-top: 20px;">
          <strong>М. Горький — «Старуха Изергиль»</strong>
        </p>
      </div>

      <!-- Секция 2: Задания -->
      <div class="pdf-section tasks-section" data-section-name="tasks">
        <p>
          <strong>
            Ответами к заданиям 1-3 являются одно-два слова или
            последовательность цифр.
          </strong>
        </p>

        <p class="ticket-pdf__task">
          <strong>1.</strong> Назовите литературное направление, принципы
          которого нашли своё воплощение в произведении «Старуха Изергиль» М.
          Горького (Ответ запишите в именительном падеже)
        </p>
        <p>Ответ: _________________________________________________</p>

        <p class="ticket-pdf__task">
          <strong>2.</strong> Установите соответствия между персонажами
          произведения и связанными с ними событиями: к каждой позиции первого
          столбца подберите соответствующую позицию из второго столбца.
        </p>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>ПЕРСОНАЖИ</th>
            <th>СОБЫТИЯ</th>
          </tr>
          <tr>
            <td>A) рассказчик</td>
            <td>1) живёт тысячи лет</td>
          </tr>
          <tr>
            <td>B) Данко</td>
            <td>2) собирает виноград в Бессарабии</td>
          </tr>
          <tr>
            <td>C) старуха Изергиль</td>
            <td>3) долго хворает в монастыре одном</td>
          </tr>
          <tr>
            <td></td>
            <td>4) вырвет сердце из груди</td>
          </tr>
        </table>
        <p>Ответ: A____ B____ C____</p>

        <p class="ticket-pdf__task">
          <strong>3.</strong> Разговор двух или нескольких лиц в литературе
          обозначается термином _____________________.
        </p>
        <p>
          Расположение и взаимосвязь всех элементов художественного текста
          называется _____________________.
        </p>
        <p>
          Ответ: _________________________ , _________________________
        </p>

        <p>
          <strong>
            При написании развёрнутых ответов на задания 4 и 5 не искажайте
            авторской позиции, приводите конкретные примеры из текста
            произведений (обращайтесь к образам, микротемам, деталям и т.п.), не
            допускайте фактических и логических ошибок; соблюдайте нормы
            литературной письменной речи, записывайте ответы аккуратно и
            разборчиво (примерный объём каждого ответа — 5–10 предложений).
          </strong>
        </p>

        <p>
          <strong>
            Выберите ОДНО из заданий: 4.1 или 4.2. Напишите прямой связный
            ответ:
          </strong>
        </p>
        <ul>
          <li>отвечая на вопрос задания, сформулируйте утверждение;</li>
          <li>аргументируйте его;</li>
          <li>
            приведите из предложенного фрагмента текста не менее ДВУХ примеров,
            подтверждающих сформулированное утверждение.
          </li>
        </ul>

        <p class="ticket-pdf__task">
          <strong>4.1</strong> Является ли Изергиль страстной натурой, которая
          живёт только чувствами? (Ответьте, опираясь на приведённый фрагмент)
          _____________________________________________________________
        </p>

        <p class="ticket-pdf__task">
          <strong>4.2</strong> Можно ли назвать поступок Изергиль (спасение
          Аркадэка из плена) подвигом? (Ответьте, опираясь на приведённый
          фрагмент)
          _____________________________________________________________
        </p>

        <p class="ticket-pdf__task">
          <strong class="ticket-pdf__task-number"> 5.</strong> Опираясь на
          приведённый фрагмент произведения (и/или другие эпизоды), сопоставьте
          образ Изергиль и образ Натальи в «Тихом Доне» М.А. Шолохова. Чем
          различается их отношение к любви?
        </p>
        <p>
          _____________________________________________________________
        </p>
        <p>
          _____________________________________________________________
        </p>
      </div>

      <!-- Секция 3: Ответы -->
      <div class="pdf-section answers-section" data-section-name="answers">
        <h2>Ответы к варианту 1</h2>

        <h3>Часть 1</h3>

        <div class="answer-item">
          <p><strong>Задание 1</strong></p>
          <p>Ответ: <span class="answer-value">романтизм</span></p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 2</strong></p>
          <p>Ответ: <span class="answer-value">A2, B4, C1</span></p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 3</strong></p>
          <p>
            Ответ:
            <span class="answer-value">диалог, композиция</span>
          </p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 4.1</strong></p>
          <p>
            <em>Примерный план ответа:</em>
          </p>
          <p>
            Изергиль действительно является страстной натурой. В приведённом
            фрагменте она говорит: «ещё жарче во мне вспыхивало желание видеть
            того, Аркадэка». Ради своей страсти она готова на убийство часового.
            При этом её чувства эгоистичны: когда Аркадэк предлагает ей любовь
            из благодарности, она даёт ему пинка и уходит.
          </p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 4.2</strong></p>
          <p>
            <em>Примерный план ответа:</em>
          </p>
          <p>
            Поступок Изергиль нельзя однозначно назвать подвигом. С одной
            стороны, она рискует жизнью ради спасения возлюбленного. С другой —
            ею движет не альтруизм, а страсть и желание обладать. Финал эпизода
            показывает разочарование Изергиль в спасённом.
          </p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 5</strong></p>
          <p>
            <em>Примерный план ответа:</em>
          </p>
          <p>
            Отношение Изергиль к любви эгоцентрично и импульсивно. Она «жадная»
            до жизни и чувств. Наталья в «Тихом Доне» любит глубоко и жертвенно,
            её чувство сопряжено с долгом и нравственным выбором. Если Изергиль
            отбрасывает любовь, когда она перестаёт быть источником наслаждения,
            то Наталья сохраняет верность своему чувству до конца.
          </p>
        </div>

        <h3>Часть 2</h3>

        <div class="answer-item">
          <p><strong>Задание 6</strong></p>
          <p>Ответ: <span class="answer-value">повтор, лирического</span></p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 7</strong></p>
          <p>Ответ: <span class="answer-value">рифма</span></p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 8</strong></p>
          <p>Ответ: <span class="answer-value">1, 2, 4, 5</span></p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 9.1</strong></p>
          <p>
            <em>Примерный план ответа:</em>
          </p>
          <p>
            Приход весны вызывает у героя прилив жизненных сил и оптимизма.
            Весна воспринимается как символ обновления, что выражается в
            призывах: «Эй, сердце, стучи по-весеннему!». Герой отрекается от
            «тускло-осеннего» и провозглашает торжество «красивого».
          </p>
        </div>

        <div class="answer-item">
          <p><strong>Задание 10</strong></p>
          <p>
            <em>Примерный план ответа:</em>
          </p>
          <p>
            Стихотворение Ф.И. Тютчева «Весенние воды» также наполнено ощущением
            пробуждения природы. Однако, в отличие от Когана, у Тютчева природа
            одушевлена сама по себе, а лирический герой лишь наблюдает за ней. У
            Когана же весна — толчок к внутреннему преображению человека.
          </p>
        </div>
      </div>
    </div>
  </div>

  <button @click="generatePdf" :disabled="isGenerating" class="generate-btn">
    {{ isGenerating ? 'Generating PDF...' : 'Download PDF' }}
  </button>
</template>

<style lang="scss">
.ticket-pdf-container {
  font-family: 'Times New Roman', Times, serif;
  font-size: 14pt;
  line-height: 1.6;
  color: #000;
  background: #ffffff;
  width: 900px;
  box-sizing: border-box;
  position: relative;

  .watermark-background {
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
    opacity: 0.07;
    pointer-events: none;
  }

  .content-wrapper {
    .pdf-section {
      position: relative;
      z-index: 1;
      padding: 55px 55px 25px;
    }
  }

  h1 {
    font-size: 22pt;
    text-align: center;
    margin-bottom: 10pt;
  }

  h2 {
    font-size: 18pt;
    text-align: center;
    margin-bottom: 15pt;
    margin-top: 20pt;
  }

  h3 {
    font-size: 16pt;
    text-align: center;
    margin-top: 20pt;
    margin-bottom: 10pt;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5pt;
  }

  h4 {
    font-size: 14pt;
    text-align: center;
    margin-top: 15pt;
    margin-bottom: 8pt;
  }

  h5 {
    font-size: 12pt;
    text-align: center;
    margin-top: 12pt;
    margin-bottom: 6pt;
  }

  .ticket-pdf__task-description {
    background-color: #f5f5f5;
    border: 1px solid #7c7c7c;
    border-radius: 10px;
    padding: 12px 16px;
  }

  .ticket-pdf__task {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 12px 16px;
    margin: 12px 0;
  }

  .ticket-pdf__task-number {
    display: inline-block;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 18pt;
    font-weight: bold;
    margin-right: 8px;
  }

  table {
    width: 100%;
    margin: 15px 0;
    border-collapse: collapse;
  }

  td,
  th {
    padding: 8px;
    text-align: left;
    border: 1px solid #000;
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;

    li {
      margin-bottom: 5px;
    }
  }

  p {
    margin: 8px 0;
  }

  .answer-item {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px dashed #999;

    &:last-child {
      border-bottom: none;
    }
  }

  .answer-value {
    font-weight: bold;
    background-color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
  }
}

.generate-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;

  &:hover:not(:disabled) {
    background-color: #34495e;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
}
</style>
