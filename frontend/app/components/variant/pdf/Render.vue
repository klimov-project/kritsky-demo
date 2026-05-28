<script setup lang="ts">
const ticketContainer = ref<HTMLElement | null>(null);

const { settings } = useKnowledgeBase();
const variant = useCurrentVariant();
const { generatePdf, isDownloadingPdf } = useVariantPdf();

const handleGeneratePdf = async () => {
  if (!ticketContainer.value) {
    console.error('PDF container not found');
    return;
  }
  await generatePdf(ticketContainer.value);
};

const Settings_var_texts = {
  part1Intro:
    'Прочитайте приведённый ниже фрагмент художественного произведения и выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.',
  part1QuestionsIntro:
    'Ответами к заданиям 1-3 являются одно-два слова или последовательность цифр.',
  part1Task4Lead:
    'При написании развёрнутых ответов на задания 4 и 5 не искажайте автор ской позиции, приводите конкретные примеры из текста произведений (обращай тесь к образам, микротемам, деталям и т.п.), не допускайте фактических и логи ческих ошибок; соблюдайте нормы литературной письменной речи, записывайте ответы аккуратно и разборчиво (примерный объём каждого ответа — 5–10 предложений).',
  part1Criteria:
    'Выберите ОДНО из заданий: 4.1 или 4.2. Напишите прямой связный ответ: — отвечая на вопрос задания, сформулируйте утверждение; — аргументируйте его; — приведите из предложенного фрагмента текста не менее ДВУХ примеров, подтверждающих сформулированное утверждение.',
  part1Task5Lead:
    'Дайте аргументированный связный ответ на вопрос задания: — укажите сходство ИЛИ различие произведений в соответствии с заданием; — приведите аргументы, подтверждающие указанное сходство/различие; — приведите из каждого произведения минимум по одному примеру, подтверждающему указанное сходство/различие; — объясните, как каждый пример подтверждает указанное сходство/различие. Допустимо обращение не только к приведённому фрагменту произведения, но и к другим эпизодам, ЕСЛИ ЭТО УКАЗАНО В ФОРМУЛИРОВКЕ ЗАДАНИЯ.',
  part2Intro:
    'Прочитайте приведённое ниже художественное произведение и выполните задания 6–8, 9.1 или 9.2 (на выбор) и задание 10.',
  part2QuestionsIntro:
    'Ответами к заданиям 6-8 являются одно-два слова или последовательность цифр.',
  part2Task9Lead:
    'При написании развёрнутых ответов на задания 9 и 10 не искажайте автор ской позиции, приводите конкретные примеры из текста произведений (обращай тесь к образам, микротемам, деталям и т.п.), не допускайте фактических и логи ческих ошибок; соблюдайте нормы литературной письменной речи, записывайте ответы аккуратно и разборчиво (примерный объём каждого ответа — 5–10 предложений).',
  part2Task9Criteria:
    'Выберите ОДНО из заданий: 9.1 или 9.2. Напишите прямой связный ответ: — отвечая на вопрос задания, сформулируйте утверждение; — аргументируйте его; — приведите из стихотворения не менее ДВУХ примеров, подтверждающих сформулированное утверждение.',
  part2Task10Lead:
    'Дайте аргументированный связный ответ на вопрос задания: — выберите для сопоставления ОДНО опубликованное стихотворение, укажите в ответе его автора и название (не допускается обращение к другому произведению того автора, которому принадлежит предложенный текст, а также к произведениям со спорной принадлежностью к художественной литературе); — укажите сходство ИЛИ различие стихотворений; — приведите аргументы, подтверждающие указанное сходство/различие; — приведите из каждого стихотворения минимум по одному примеру, подтверждающему указанное сходство/различие; — объясните, как каждый пример подтверждает указанное сходство/различие.',
  part3Intro:
    'Выберите только ОДНУ из пяти предложенных тем сочинений (11.1–11.5). Напишите сочинение, соблюдая следующие требования: 1. Сформулируйте не менее трёх аргументированных утверждений, раскрывающих тему (не искажайте авторской позиции). 2. Подтвердите сформулированные утверждения конкретными примерами из текста произведения(-ий); объясните, как эти примеры подтверждают утверждения, раскрывающие тему. 3. Опирайтесь на теоретико-литературные понятия (или искусствоведческие — в сочинении на тему 11.5), не менее двух понятий используйте для анализа текста произведения(-ий). 4. Соблюдайте логику рассуждения, избегайте отступления от темы. 5. Пишите разборчивым почерком; соблюдайте речевые, орфографические, пунктуационные и грамматические нормы. 6. В сочинении должно быть не менее 200 слов (при меньшем объёме за сочинение выставляется 0 баллов). Не допускается обращения к произведениям со спорной принадлежностью к художественной литературе.',
};
</script>

<template>
  <div ref="ticketContainer" class="ticket-pdf-container hide-from-display">
    <!-- Основной контент -->
    <div class="content-wrapper">
      <!-- Секция 1: Отрывок и задачи 1-2 -->
      <div class="pdf-section two-page-excerpt" data-section-name="excerpt">
        <h1>Вариант 1</h1>
        <h2>Часть 1</h2>

        <VariantTaskInstruction class="ticket-pdf__task-description">
          {{ settings.variantTexts.part1Intro }}
        </VariantTaskInstruction>

        <!-- Рендер отрывка -->
        <div v-if="variant">
          <VariantExcerpt
            :excerpt-text="variant.excerpt?.text"
            :excerpt-author="variant.work?.author"
            :excerpt-work="variant.work?.title"
          />

          <!-- Задачи 1-3 и 4-5 -->
          <div class="tasks-group-1">
            <VariantTaskList1 />
            <VariantTaskList2 />
          </div>
        </div>
      </div>

      <!-- Секция 2: Стихотворение и задачи 3-4 -->
      <div class="pdf-section poem-section" data-section-name="poem">
        <VariantTaskInstruction>
          {{ settings.variantTexts.part2Intro }}
        </VariantTaskInstruction>

        <!-- Рендер стихотворения -->
        <div v-if="variant">
          <VariantPoem
            :poem-text="variant.poem?.text"
            :poet-name="variant.poet?.name"
            :poem-title="variant.poem?.title"
          />

          <!-- Задачи 6-10 -->
          <div class="tasks-group-2">
            <VariantTaskList3 />
            <VariantTaskList4 />
          </div>
        </div>
      </div>

      <!-- Секция 3: Задачи 11  -->
      <div class="pdf-section tasks-11-section" data-section-name="tasks-11">
        <VariantTaskInstruction>
          {{ settings.variantTexts.part1QuestionsIntro }}
        </VariantTaskInstruction>
        <!-- Задачи 11.1-11.5 -->
        <div v-if="variant">
          <VariantTaskList5 />
        </div>
      </div>
    </div>
  </div>

  <button
    @click="handleGeneratePdf"
    :disabled="isDownloadingPdf"
    class="generate-btn"
  >
    {{ isDownloadingPdf ? 'Generating PDF...' : 'Download PDF' }}
  </button>
</template>

<style lang="scss">
// Скрытие контейнера от основного отображения
.hide-from-display {
  position: absolute !important;
  // left: -9999px;
  // top: 0;
  // z-index: -1;
  left: 100%;
  top: 0;
  opacity: 0.5;
}
.ticket-pdf-container {
  font-family: 'Times New Roman', Times, serif;
  font-size: 14pt;
  line-height: 1.6;
  color: #000;
  background: #ffffff;
  width: 900px;
  box-sizing: border-box;
  position: relative;

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

  .tasks-group-1,
  .tasks-group-2 {
    margin-top: 20px;
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
