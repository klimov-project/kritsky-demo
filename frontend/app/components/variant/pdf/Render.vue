<script setup lang="ts">
const ticketContainer = ref<HTMLElement | null>(null);

const { settings } = useKnowledgeBase();
const variant = useCurrentVariant();
const {
  generatePdf,
  isDownloadingPdf,
  answersText,
  collectAllAnswers,
} = useVariantPdf();

const handleGeneratePdf = async () => {
  if (!ticketContainer.value) {
    console.error('PDF container not found');
    return;
  }
  collectAllAnswers();
  console.log(
    'Collected answersText before generating PDF:',
    answersText.value,
  );
  await generatePdf(ticketContainer.value);
};
</script>

<template>
  <div ref="ticketContainer" class="ticket-pdf-container hide-from-display">
    <!-- Основной контент -->
    <div class="content-wrapper">
      <!-- variant.excerpt : {{ variant.excerpt }} -->
      <!-- Секция 1: Отрывок -->
      <VariantPdfExcerpt
        v-if="variant"
        :part1Intro="settings.variantTexts.part1Intro"
        :excerpt-text="variant.excerpt?.text"
        :text-columns="variant.excerpt?.textColumns"
        :text-second-column="variant.excerpt?.textSecondColumn"
        :excerpt-author="variant.work?.author"
        :excerpt-work="variant.work?.title"
      />

      <!-- Секция 2: Задания  1-5  -->
      <div class="pdf-section tasks-section" data-section-name="tasks">
        <VariantPdfTaskList1 />
        <VariantPdfTaskList2 />
      </div>

      <!-- Секция 3: Стихотворение и задачи 6-10 -->
      <VariantPdfPoem
        v-if="variant"
        :poem-text="variant.poem?.text"
        :poet-name="variant.poet?.name"
        :poem-title="variant.poem?.title"
      />
      <!-- Секция 4: Задачи 6-10 -->
      <div class="pdf-section tasks-section" data-section-name="tasks">
        <VariantPdfTaskList3 />
        <VariantPdfTaskList4 />
      </div>

      <!-- Секция 5: Задачи 11  -->
      <div class="pdf-section tasks-11-section" data-section-name="tasks-11">
        <VariantPdfTaskList5 />
      </div>

      <!-- Секция 3: Ответы -->
      <div class="pdf-section answers-section" data-section-name="answers">
        <h2>Ответы к варианту 1</h2>

        <div class="answers" v-html="answersText"></div>
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
  left: -9999px;
  top: 0;
  z-index: -1;
  // left: 100%;
  // top: 0;
  // opacity: 0.5;
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
