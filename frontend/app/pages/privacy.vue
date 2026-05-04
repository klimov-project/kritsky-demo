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
          Политика конфиденциальности
        </h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-12">
      <div class="space-y-6 text-gray-700">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            1. Информация, которую мы собираем
          </h2>
          <p>
            Мы собираем информацию, которую вы предоставляете при регистрации:
            имя, адрес электронной почты, номер телефона.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            2. Как мы используем информацию
          </h2>
          <p>
            Информация используется для предоставления услуг, улучшения качества
            сервиса, отправки уведомлений и рассылок (с вашего согласия).
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            3. Защита данных
          </h2>
          <p>
            Мы применяем стандартные меры безопасности для защиты ваших личных
            данных от несанкционированного доступа.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">4. Файлы cookie</h2>
          <p>
            Наш сайт использует файлы cookie для улучшения опыта пользователя.
            Вы можете отключить cookie в настройках браузера.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            5. Контактная информация
          </h2>
          <p>
            Если у вас есть вопросы, пожалуйста, свяжитесь с нами по адресу:
            support@kritsky.academy
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
