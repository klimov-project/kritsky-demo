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
          Пользовательское соглашение
        </h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-12">
      <div class="space-y-6 text-gray-700">
        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            1. Принятие условий
          </h2>
          <p>
            Используя данный сервис, вы соглашаетесь со всеми условиями,
            изложенными в данном соглашении.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            2. Использование сервиса
          </h2>
          <p>
            Вы обязуетесь использовать сервис только в законных целях и не
            нарушать права третьих лиц.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            3. Интеллектуальная собственность
          </h2>
          <p>
            Все содержание сервиса защищено авторским правом. Запрещено
            копировать, воспроизводить или распространять контент без
            разрешения.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            4. Ограничение ответственности
          </h2>
          <p>
            Сервис предоставляется "как есть" без гарантий. Мы не несем
            ответственность за убытки, возникшие в результате использования
            сервиса.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            5. Изменения условий
          </h2>
          <p>
            Мы оставляем право изменять условия соглашения в любой момент.
            Продолжение использования сервиса означает принятие новых условий.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>
