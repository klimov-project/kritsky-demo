<script setup lang="ts">
const props = defineProps<{
  leftLabel: string;
  rightLabel: string;
  pairs: Array<{
    id: string;
    character: string;
    properties?: string[];
    characteristics?: string[];
  }>;
  options: string[];
}>();

// Создаём статичную копию массива pairs для гарантии порядка
const sortedPairs = computed(() => {
  return [...props.pairs].sort((a, b) => a.id.localeCompare(b.id));
});

// Создаём статичную копию массива options для гарантии порядка
const sortedOptions = computed(() => {
  return [...props.options].sort((a, b) => {
    // Сортируем по содержимому для стабильности
    return a.localeCompare(b);
  });
});

// Получаем соответствия персонажей и их фраз
const getCharacterMatches = () => {
  const matches: {
    character: string;
    phrase: string;
    optionIndex: number;
  }[] = [];

  sortedPairs.value.forEach((pair) => {
    // Ищем фразу персонажа в options
    const phraseToFind =
      pair.properties?.[0] || pair.characteristics?.[0] || '';

    // Находим индекс этой фразы в options
    const optionIndex = sortedOptions.value.findIndex((opt) => {
      // Убираем HTML теги для сравнения
      const cleanOpt = opt.replace(/<[^>]*>/g, '').trim();
      const cleanPhrase = phraseToFind.replace(/<[^>]*>/g, '').trim();
      return cleanOpt === cleanPhrase;
    });

    if (optionIndex !== -1) {
      matches.push({
        character: pair.character,
        phrase: phraseToFind,
        optionIndex: optionIndex + 1, // +1 для отображения номера (1-based)
      });
    }
  });

  return matches;
};

const characterMatches = computed(() => getCharacterMatches());

// Формируем строку ответа в формате "А-3, Б-1, В-2"
const formattedMatches = computed(() => {
  const matches: { letter: string; number: number }[] = [];

  sortedPairs.value.forEach((pair, index) => {
    const letter = String.fromCharCode(65 + index);
    const phraseToFind =
      pair.properties?.[0] || pair.characteristics?.[0] || '';

    const optionIndex = sortedOptions.value.findIndex((opt) => {
      const cleanOpt = opt.replace(/<[^>]*>/g, '').trim();
      const cleanPhrase = phraseToFind.replace(/<[^>]*>/g, '').trim();
      return cleanOpt === cleanPhrase;
    });

    if (optionIndex !== -1) {
      matches.push({
        letter: letter,
        number: optionIndex + 1,
      });
    }
  });

  // return matches.map((m) => `${m.letter}-${m.number}`).join(', ');
  return matches.map((m) => `${m.number}`).join('');
});

defineExpose({
  getAnswer: () => formattedMatches.value,
  answer: formattedMatches,
});
</script>

<template>
  <div class="w-full grid grid-cols-2 gap-8 mb-6">
    <div>
      <div
        class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
      >
        {{ leftLabel }}
      </div>
      <div class="mb-5 py-2">
        <ol class="list-none m-0 p-0" start="1">
          <li
            class="flex items-start gap-2"
            v-for="(pair, index) in sortedPairs"
            :key="pair.id"
          >
            <span class="font-semibold min-w-[30px]">
              {{ String.fromCharCode(65 + index) }})
            </span>
            <span>{{ pair.character }}</span>
          </li>
        </ol>
      </div>
      <table class="w-auto border border-gray-300">
        <thead>
          <tr>
            <th
              v-for="(pair, index) in sortedPairs"
              class="border border-gray-300 p-2"
            >
              {{ String.fromCharCode(65 + index) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td v-for="pair in sortedPairs" class="border border-gray-300 p-2">
              <div class="opacity-0">___ ___ ___</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Правая колонка -->
    <div>
      <div
        class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
      >
        {{ rightLabel }}
      </div>
      <div class="mb-5 py-2">
        <ol class="space-y-2 list-none m-0 p-0">
          <li
            v-for="(option, index) in sortedOptions"
            :key="index"
            class="flex items-start gap-2"
          >
            <span class="font-semibold min-w-[30px]">{{ index + 1 }})</span>
            <span v-html="option" class="flex-1"></span>
          </li>
        </ol>
      </div>
    </div>

    <!-- Скрытый блок с правильными ответами для отладки -->
    <div v-if="false" class="mt-4 p-3 bg-gray-100 rounded">
      <div class="font-semibold mb-2">Правильные соответствия:</div>
      <div
        v-for="match in characterMatches"
        :key="match.character"
        class="text-sm"
      >
        {{ match.character }} → (№{{ match.optionIndex }}) "{{ match.phrase.replace(/<[^>]*>/g, '') }}"
        
      </div>
      <div class="font-semibold mt-2">
        Формат ответа: {{ formattedMatches }}
      </div>
    </div>
  </div>
</template>
