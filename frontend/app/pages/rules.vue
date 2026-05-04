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
        <h1 class="text-3xl font-bold text-gray-900 mt-2">
          Правила пользования
        </h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-12">
      <div class="space-y-6 text-gray-700">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Как пользоваться генератором
          </h2>
          <ol class="list-decimal list-inside space-y-2">
            <li>Зарегистрируйтесь или войдите в свой аккаунт</li>
            <li>Перейдите на страницу конструктора</li>
            <li>Выберите необходимые параметры генерации</li>
            <li>Нажмите кнопку "Сгенерировать вариант"</li>
            <li>Сохраните или скачайте полученный вариант</li>
          </ol>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Ограничения на использование
          </h2>
          <ul class="list-disc list-inside space-y-2">
            <li>Бесплатные пользователи: до 3 генераций в день</li>
            <li>Подписчики: неограниченная генерация</li>
            <li>Скачивание: до 3 файлов в день для подписчиков</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Запрещённые действия
          </h2>
          <ul class="list-disc list-inside space-y-2">
            <li>Перепродажа сгенерированных вариантов</li>
            <li>Массовое скачивание или экспорт данных</li>
            <li>Использование ботов или автоматизированных инструментов</li>
            <li>Нарушение авторских прав при распространении материалов</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Техническая поддержка
          </h2>
          <p>
            Если у вас возникли проблемы при использовании генератора,
            пожалуйста, свяжитесь с нашей командой поддержки через форму
            обратной связи.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
