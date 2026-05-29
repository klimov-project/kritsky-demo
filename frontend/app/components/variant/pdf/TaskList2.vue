<script setup lang="ts">
const { settings } = useKnowledgeBase();
const someTasks4 = ['task4_1', 'task4_2'];
const task5 = 'task5';
</script>

<template>
  <section class="tasks-section-3">
    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part1Task4Lead }}
    </VariantPdfTaskInstruction>

    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part1Criteria }}
      <!-- Выберите ОДНО из заданий: 4.1 или 4.2. Напишите прямой связный ответ:
      <ul>
        <li>- отвечая на вопрос задания, сформулируйте утверждение;</li>
        <li>- аргументируйте его</li>
        <li>
          - приведите из предложенного фрагмента текста не менее ДВУХ примеров,
          подтверждающих сформулированное утрверждение.
        </li>
      </ul> -->
    </VariantPdfTaskInstruction>

    <VariantPdfTask
      v-for="taskKey in someTasks4"
      :key="taskKey"
      :task-key="taskKey"
    />

    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part1Task5Lead }}
      <!-- Дайте аргументированный связный ответ на вопрос задания: <br />
      - укажите сходство ИЛИ различие произведений в соответствии с заданием; -->
    </VariantPdfTaskInstruction>

    <VariantPdfTask :task-key="task5" />
  </section>
</template>
<style lang="scss"></style>
