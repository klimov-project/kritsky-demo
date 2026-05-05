<script setup lang="ts">
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';

definePageMeta({
  layout: 'default',
});

const { kbStore, loadKnowledgeBase } = useKnowledgeBase();
await loadKnowledgeBase();

const totalWorks = computed(() => kbStore.works.length);
const totalPoets = computed(() => kbStore.poets.length);
const hasError = computed(() => !!kbStore.error);
</script>

<template>
  <section class="min-h-screen bg-slate-50 py-14">
    <div class="max-w-5xl mx-auto px-4">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div class="px-8 py-10 sm:px-12">
          <h1 class="text-4xl font-bold text-slate-900 mb-4">
            Создать вариант ЕГЭ
          </h1>
          <p class="text-lg text-slate-600 mb-8">
            Быстрый доступ к базе знаний и оптимизированная загрузка материала.
          </p>

          <div class="grid gap-4 sm:grid-cols-2 mb-8">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p class="text-sm uppercase tracking-[0.18em] text-slate-400 mb-2">
                Произведений в базе
              </p>
              <p class="text-5xl font-semibold text-slate-900">{{ totalWorks }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p class="text-sm uppercase tracking-[0.18em] text-slate-400 mb-2">
                Поэтов в базе
              </p>
              <p class="text-5xl font-semibold text-slate-900">{{ totalPoets }}</p>
            </div>
          </div>

          <div v-if="hasError" class="rounded-2xl border border-red-200 bg-red-50 p-6 mb-6 text-red-700">
            Не удалось загрузить базу знаний. Попробуйте обновить страницу.
          </div>

          <div class="space-y-4">
            <p class="text-slate-600 leading-7">
              Используйте данные из единого кеша для создания новых вариантов без лишних повторных запросов.
            </p>
            <p class="text-slate-600 leading-7">
              Если данные устарели, вы можете очистить кеш в админке, и база будет обновлена автоматически.
            </p>
          </div>

          <div class="mt-10 flex flex-col sm:flex-row gap-4">
            <NuxtLink
              to="/public-variant"
              class="inline-flex items-center justify-center rounded-full bg-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-700 transition"
            >
              Сгенерировать вариант
            </NuxtLink>
            <NuxtLink
              to="/admin/materials"
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Управление базой знаний
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
