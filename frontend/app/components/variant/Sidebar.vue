<script setup lang="ts"></script>

<template>
  <aside
    class="hidden lg:block w-64 flex-shrink-0 absolute top-0 left-0 h-full -translate-x-full"
  >
    <div class="bg-white rounded-lg shadow p-4 sticky top-0">
      <nav class="space-y-2 mb-6">
        <button
          class="w-full text-left px-3 py-2 rounded bg-blue-50 text-blue-700 font-medium text-sm"
        >
          Весь вариант
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только отрывок
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только стихотворение
        </button>
      </nav>

      <div class="pt-4">
        <a
          href="mailto:support@kritsky.academy"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
            />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Обратная связь
        </a>
      </div>
    </div>
  </aside>
</template>
