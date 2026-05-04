<script setup lang="ts">
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <NuxtLink to="/" class="text-blue-600 hover:text-blue-700 font-medium">
          ← На главную
        </NuxtLink>
        <h1 class="text-3xl font-bold text-gray-900 mt-2">О проекте</h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-12">
      <div class="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">История проекта</h2>
          <p class="text-gray-600">
            Проект "Критский" создан для облегчения подготовки учащихся к ЕГЭ по
            литературе. Наш конструктор позволяет генерировать неограниченное
            количество уникальных вариантов экзамена в полном соответствии с
            официальным форматом.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Цель</h2>
          <p class="text-gray-600">
            Помочь учителям и репетиторам экономить время на подготовку к
            экзамену, предоставляя инструменты для быстрой генерации вариантов с
            гарантированным соответствием формату ЕГЭ.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Возможности</h2>
          <ul class="list-disc list-inside space-y-2 text-gray-600">
            <li>Генерация вариантов ЕГЭ любого уровня сложности</li>
            <li>Выбор вариантов по авторам и произведениям</li>
            <li>Сохранение и скачивание вариантов</li>
            <li>Интегрированная проверка ответов</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Контакты</h2>
          <p class="text-gray-600">
            ИП Крицкий Роман Дмитриевич<br />
            ИНН: 772796119977<br />
            ОГРНИП: 325774600403322
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
