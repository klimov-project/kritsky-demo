<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

// Mock books data
const books = ref([
  {
    id: '1',
    title: 'Сборник вариантов 2024',
    price: 499,
    sales: 45,
    status: 'active',
  },
  {
    id: '2',
    title: 'Пробный вариант Апрель',
    price: 99,
    sales: 128,
    status: 'active',
  },
  {
    id: '3',
    title: 'Архив вариантов 2023',
    price: 299,
    sales: 67,
    status: 'inactive',
  },
]);

const showAddModal = ref(false);
const newBook = ref({ title: '', price: 0 });

const toggleStatus = (book: any) => {
  book.status = book.status === 'active' ? 'inactive' : 'active';
};

const addBook = () => {
  books.value.push({
    id: String(books.value.length + 1),
    title: newBook.value.title,
    price: newBook.value.price,
    sales: 0,
    status: 'active',
  });
  newBook.value = { title: '', price: 0 };
  showAddModal.value = false;
};
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Книги и сборники</h1>
        <p class="text-gray-600 mt-1">Управление продуктами магазина</p>
      </div>
      <button
        @click="showAddModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        + Добавить книгу
      </button>
    </div>

    <!-- Books Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="book in books"
        :key="book.id"
        class="bg-white rounded-lg shadow overflow-hidden"
      >
        <div
          class="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <span class="text-white text-4xl">📖</span>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between">
            <h3 class="font-bold text-gray-900">{{ book.title }}</h3>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                book.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500',
              ]"
            >
              {{ book.status === 'active' ? 'Активна' : 'Скрыта' }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-4 text-center">
            <div class="bg-gray-50 rounded p-2">
              <p class="text-lg font-bold text-blue-600">{{ book.price }} ₽</p>
              <p class="text-xs text-gray-500">Цена</p>
            </div>
            <div class="bg-gray-50 rounded p-2">
              <p class="text-lg font-bold text-green-600">{{ book.sales }}</p>
              <p class="text-xs text-gray-500">Продаж</p>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium"
            >
              Редактировать
            </button>
            <button
              @click="toggleStatus(book)"
              :class="[
                'flex-1 py-2 rounded text-sm font-medium',
                book.status === 'active'
                  ? 'bg-red-100 hover:bg-red-200 text-red-700'
                  : 'bg-green-100 hover:bg-green-200 text-green-700',
              ]"
            >
              {{ book.status === 'active' ? 'Скрыть' : 'Показать' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Добавить книгу</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Название</label
            >
            <input
              v-model="newBook.title"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Цена (₽)</label
            >
            <input
              v-model.number="newBook.price"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
          <button
            @click="addBook"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
