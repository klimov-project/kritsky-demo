<script setup lang="ts">
const { settings } = useKnowledgeBase();
const someTasks4 = ['task4_1', 'task4_2'];
const task5 = 'task5';
</script>

<template>
  <section
    class="tasks-section-2 w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]"
  >
    <VariantTaskInstruction>
      {{ settings.variantTexts.part1Task4Lead }}
    </VariantTaskInstruction>

    <TaskInstruction>
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
    </TaskInstruction>

    <VariantTask
      v-for="taskKey in someTasks4"
      :key="taskKey"
      :task-key="taskKey"
    />

    <TaskInstruction>
      Дайте аргументированный связный ответ на вопрос задания: <br />
      - укажите сходство ИЛИ различие произведений в соответствии с заданием;
    </TaskInstruction>

    <VariantTask :task-key="task5" />
  </section>
</template>
<style lang="scss">
.tasks-section-3 {
  .task-container + .task-info {
    margin-top: 20px;
  }
}
</style>
