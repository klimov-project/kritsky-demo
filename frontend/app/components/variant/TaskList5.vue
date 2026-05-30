<script setup lang="ts">
const { pending: kbPending, settings } = useKnowledgeBase();
const { refreshLoadingByBlock, isInitialLoading } = useVariantState();
const { refreshBlock } = useGenerateVariant();

const isLoading = computed(
  () =>
    kbPending.value ||
    isInitialLoading.value ||
    refreshLoadingByBlock.value.block1,
);
const lastTasks = ['task11_1', 'task11_2', 'task11_3', 'task11_4', 'task11_5'];

const { isLocked } = useAuth();
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
    <VariantTaskInstruction>
      {{ settings.variantTexts.part3Intro }}
      <!-- <p>
        Выберите только ОДНУ из пяти предложенных тем сочинений (11.1–11.5).
      </p>
      <p>Напишите сочинение, соблюдая следующие требования:</p>
      <ol>
        <li>
          Сформулируйте не менее трёх аргументированных утверждений,
          раскрывающих тему (не искажайте авторской позиции).
        </li>
        <li>
          Подтвердите сформулированные утверждения конкретными примерами из
          текста произведения(-ий); объясните, как эти примеры подтверждают
          утверждения, раскрывающие тему.
        </li>
        <li>
          Опирайтесь на теоретико-литературные понятия (или искусствоведческие —
          в сочинении на тему 11.5), не менее двух понятий используйте для
          анализа текста произведения(-ий).
        </li>
        <li>Соблюдайте логику рассуждения, избегайте отступления от темы.</li>
        <li>
          Пишите разборчивым почерком; соблюдайте речевые, орфографические,
          пунктуационные и грамматические нормы.
        </li>
        <li>
          В сочинении должно быть не менее 200 слов (при меньшем объёме за
          сочинение выставляется 0 баллов).
        </li>
      </ol>
      <p>
        Не допускается обращения к произведениям со спорной принадлежностью к
        художественной литературе.
      </p> -->
    </VariantTaskInstruction>

    <div class="flex justify-center items-center mb-7 no-print">
      <BaseButton
        @click="refreshBlock('block3')"
        :loading="isLoading"
        :disabled="isLoading"
        class="update-variant-btn__filter"
        :isLocked="isLocked"
      >
        обновить все 11-ые задания
      </BaseButton>
    </div>
    <VariantTask
      v-for="taskKey in lastTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
