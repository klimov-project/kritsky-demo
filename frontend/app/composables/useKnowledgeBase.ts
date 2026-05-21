// composables/useKnowledgeBase.ts
import type {
  KnowledgeBasePayload,
  Poet,
  Work,
} from '~/types/knowledgeBaseTypes';

interface KnowledgeBaseResponse extends KnowledgeBasePayload {
  works?: Work[];
  poets?: Poet[];
  _metadata?: {
    hash: string;
    fetchedAt: string;
    computed: {
      variantsCount: number;
      poetsCount: number;
      totalEntities: number;
    };
  };
}

// Моковые данные (урезанные до ~10%)
const mockWorks: Work[] = [
  {
    id: 'work-mock-001',
    title: 'Гроза',
    author: 'А.Н. Островский',
    authorId: 'АНОстровский',
    workId: 'work-id-mock-001',
    age18: false,
    internalTags: '',
    externalTags: '',
    commonTasks: {
      task1: [
        {
          id: 'task1-mock-001',
          text: 'К какому роду литературы принадлежит «Гроза»?',
          answer: 'драма',
          termId: 'драма',
          authorId: '',
          tags: '',
          isTermQuestion: true,
        },
        {
          id: 'task1-mock-002',
          text: 'К какому литературному направлению следует отнести «Грозу»?',
          answer: 'реализм',
          termId: 'реализм',
          authorId: '',
          tags: '',
          isTermQuestion: true,
        },
      ],
      task2: [
        {
          id: 'task2-mock-001',
          prompt: 'Установите соответствия между персонажами и их судьбой',
          leftLabel: 'ПЕРСОНАЖИ',
          rightLabel: 'СУДЬБА',
          pairs: [
            {
              id: 'pair-mock-001',
              character: 'Тихон',
              properties: [],
              phrases: [],
              characteristics: ['бросит упрёк матери'],
              propertyIds: ['pair-mock-001:0'],
            },
            {
              id: 'pair-mock-002',
              character: 'Борис',
              properties: ['уедет в Сибирь', 'уедет в Тяхту, к китайцам'],
              phrases: [],
              characteristics: ['уедет в Сибирь'],
              propertyIds: ['pair-mock-002:0', 'pair-mock-002:1'],
            },
          ],
          extraOption: '',
          termId: '',
          authorId: '',
          characterSource: 'mixed',
          pairPropertyType: 'characteristics',
          tags: '',
          characterCount: 3,
        },
      ],
      task3: [
        {
          id: 'task3-mock-001',
          part1:
            '«Гроза» А.Н. Островского принадлежит к такому роду литературы, как _____________________ .',
          part2: '',
          answer1: 'драма',
          answer2: '',
          termId1: 'драма',
          termId2: '',
          tags: 'автор, принадлежит',
        },
      ],
    },
    characters: [],
    excerpts: [
      {
        id: 'excerpt-mock-001',
        order: 1,
        title: 'Явления 1 и 2. Кудряш и Шапкин обсуждают характер Дикого',
        excerptId: 'excerpt-id-mock-001',
        text:
          '<p>Общественный сад на высоком берегу Волги. Кулигин сидит на скамье и смотрит за реку.</p>',
        chapter: 'Действие Первое',
        themeInternalId: 'самодур',
        tasks: {
          excludeTask1Ids: [],
          excludeTask2Ids: [],
          excludeTask3Ids: [],
          customTask1: [],
          customTask2: [],
          customTask3: [],
          task4_1: [],
          task4_2: [],
          task5: [],
          excludeTask2Properties: [],
          excludeTask2Characters: [],
        },
      },
    ],
  },
];

const mockPoets: Poet[] = [
  {
    id: 'poet-mock-001',
    name: 'А.Н. Островский',
    worksCount: 1,
  },
];

export function useKnowledgeBase() {
  const store = useKnowledgeBaseStore();
  const config = useRuntimeConfig();

  // ЗАКОММЕНТИРОВАН РЕАЛЬНЫЙ ЗАПРОС
  // const apiUrl = import.meta.server
  //   ? `${config.apiBackendBase}/api`
  //   : config.public.nitroApiUrl;
  //
  // const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
  //   `${apiUrl}/knowledge-base`,
  //   {
  //     server: true,
  //     key: 'knowledge-base',
  //     getCachedData: (key) => {
  //       const cached = useNuxtApp().payload.data[key];
  //       return cached || undefined;
  //     },
  //     transform: (response) => {
  //       if (response._metadata?.hash !== store.lastKnownHash) {
  //         console.log('[Store] Hydrating, response._metadata:', response._metadata);
  //         store.hydrate(response);
  //       }
  //       return response;
  //     },
  //   },
  // );

  // Моковый ответ
  const mockResponse: KnowledgeBaseResponse = {
    works: mockWorks,
    poets: mockPoets,
    _metadata: {
      hash: 'mock-hash-20250101',
      fetchedAt: new Date().toISOString(),
      computed: {
        variantsCount: 1,
        poetsCount: 1,
        totalEntities: 2,
      },
    },
  };

  // Имитация загрузки (быстрая)
  const pending = ref(false);
  const error = ref(null);
  const data = ref<KnowledgeBaseResponse | null>(mockResponse);

  // refresh имитирует обновление данных с небольшим изменением
  const refresh = async () => {
    pending.value = true;
    error.value = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Немного изменяем моковые данные при обновлении
      const updatedResponse = {
        ...mockResponse,
        _metadata: {
          ...mockResponse._metadata!,
          hash: `mock-hash-${Date.now()}`,
          fetchedAt: new Date().toISOString(),
        },
      };
      data.value = updatedResponse;

      if (updatedResponse._metadata?.hash !== store.lastKnownHash) {
        console.log(
          '[Store] Hydrating from mock, new hash:',
          updatedResponse._metadata?.hash,
        );
        store.hydrate(updatedResponse);
      }
    } catch (err) {
      error.value = err as any;
    } finally {
      pending.value = false;
    }
  };

  // Гидратация стора при инициализации (если хеш не совпадает)
  if (mockResponse._metadata?.hash !== store.lastKnownHash) {
    console.log(
      '[Store] Initial hydration from mock, hash:',
      mockResponse._metadata?.hash,
    );
    store.hydrate(mockResponse);
  }

  const variantsCount = computed(() => {
    return data.value?._metadata?.computed?.variantsCount ?? 0;
  });

  const works = computed(() => store.works || []);
  const poets = computed(() => store.poets || []);
  const themes = computed(() => store.themes || []);

  return {
    data: readonly(data),
    works,
    poets,
    themes,
    pending: readonly(pending),
    error: readonly(error),
    refresh,
    variantsCount,
    store,
  };
}
