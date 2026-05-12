<script setup lang="ts">
const longTasks = [
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
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      <p>
        <i>
          При написании развёрнутых ответов на задания 4 и 5 не искажайте автор
          ской позиции, приводите конкретные примеры из текста произведений
          (обращайтесь к образам, микротемам, деталям и т.п.), не допускайте
          фактических и логи ческих ошибок; соблюдайте нормы литературной
          письменной речи, записывайте ответы аккуратно и разборчиво (примерный
          объём каждого ответа — 5–10 предложений).
        </i>
      </p>
    </VariantTaskInstruction>
    <VariantTask
      v-for="taskKey in longTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
