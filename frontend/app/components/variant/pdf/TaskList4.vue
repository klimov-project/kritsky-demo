<script setup lang="ts">
const { settings } = useKnowledgeBase();
const customTasks = ['task9_1', 'task9_2'];
const task10 = 'task10';
</script>

<template>
  <section class="tasks-section-4">
    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part2Task9Lead }}
    </VariantPdfTaskInstruction>

    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part2Task9Criteria }}
      <!-- Выберите ОДНО из заданий: 9.1 или 9.2. Напишите прямой связный ответ:
      <ul>
        <li>— отвечая на вопрос задания, сформулируйте утверждение;</li>
        <li>— аргументируйте его;</li>
        <li>
          — приведите из стихотворения не менее ДВУХ примеров, подтверждающих
          сформулированное утверждение.
        </li>
      </ul> -->
    </VariantPdfTaskInstruction>
    <VariantPdfTask
      v-for="taskKey in customTasks"
      :key="taskKey"
      :task-key="taskKey"
    />

    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part2Task10Lead }}
      <!-- Дайте аргументированный связный ответ на вопрос задания:

      <ul>
        <li>
          — выберите для сопоставления ОДНО опубликованное стихотворение,
          укажите в ответе его автора и название (не допускается обращение к
          другому произведению того автора, которому принадлежит предложенный
          текст, а также к произведениям со спорной принадлежностью к
          художественной литературе);
        </li>
        <li>— укажите сходство ИЛИ различие стихотворений;</li>
        <li>
          — приведите аргументы, подтверждающие указанное сходство/различие;
        </li>
        <li>
          — приведите из каждого стихотворения минимум по одному примеру,
          подтверждающему указанное сходство/различие;
        </li>
        <li>
          — объясните, как каждый пример подтверждает указанное
          сходство/различие.
        </li>
      </ul> -->
    </VariantPdfTaskInstruction>

    <VariantPdfTask :task-key="task10" />
  </section>
</template>
