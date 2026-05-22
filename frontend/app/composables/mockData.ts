import type { Poet, Work, Block3Data } from '~/types/knowledgeBaseTypes';

export interface mKnowledgeBaseResponse {
  works?: Work[];
  poets?: Poet[];
  block3?: Block3Data;
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

export const mockWorks: Work[] = [
  {
    id: 'work-mock-001',
    title: 'Гроза',
    author: 'А.Н. Островский',
    authorId: 'ostrovsky',
    workId: 'work-id-thunder',
    age18: false,
    internalTags: '',
    externalTags: '',
    commonTasks: {
      task1: [
        {
          id: 'task1-mock-001',
          text:
            'В каком году был написан "Гроза" А.Н. Островского? (Введите ответ в именительном падеже)',
          answer: '1859',
          termId: '1859',
          authorId: '',
          tags: '',
          isTermQuestion: true,
        },
        {
          id: 'task1-mock-002',
          text:
            'Кто является главным героем пьесы "Гроза"? (Введите ответ в именительном падеже)',
          answer: 'Катерина',
          termId: 'Катерина',
          authorId: '',
          tags: '',
          isTermQuestion: true,
        },
      ],
      task2: [],
      task3: [],
    },
    characters: [],
    excerpts: [
      {
        id: 'excerpt-mock-001',
        order: 1,
        title: 'Действие 1. Явление 1. Бульвар на берегу Волги',
        chapter: 'Действие первое',
        excerptId: 'excerpt-id-mock-001',
        text:
          '<p>Сад на высоком берегу Волги, за Волгой сельский вид. На скамейке сидит Кудряш и Кудряш. Гроза собирается.</p>',
        textColumns: 1,
        textSecondColumn: '',
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
        themeInternalId: 'любовь, драма',
        isActive: true,
      },
    ],
  },
  {
    id: 'work-mock-002',
    title: 'Евгений Онегин',
    author: 'А.С. Пушкин',
    authorId: 'pushkin',
    workId: 'work-id-onegin',
    age18: false,
    internalTags: '',
    externalTags: '',
    commonTasks: {
      task1: [
        {
          id: 'task1-mock-003',
          text: "Жанр романа 'Евгений Онегин'?",
          answer: 'роман в стихах',
          termId: 'роман в стихах',
          authorId: '',
          tags: '',
          isTermQuestion: true,
        },
      ],
      task2: [],
      task3: [],
    },
    characters: [
      {
        id: 'char-mock-001',
        name: 'Евгений Онегин',
        description: 'Молодой дворянин, разочарованный в жизни',
        traits: ['хандрит', 'циничен', 'образован'],
      },
      {
        id: 'char-mock-002',
        name: 'Татьяна Ларина',
        description: 'Девушка из провинции, влюбленная в Онегина',
        traits: ['чувствительна', 'искренна', 'верна долгу'],
      },
    ],
    excerpts: [],
  },
];

export const mockPoets: Poet[] = [
  {
    id: 'poet-mock-001',
    name: 'А.С. Пушкин',
    authorId: 'pushkin',
    poems: [
      {
        id: 'poem-mock-001',
        title: 'Я помню чудное мгновенье',
        poemId: 'poem-id-kern',
        text: '<p>Я помню чудное мгновенье: Передо мной явилась ты...</p>',
        age18: false,
        tasks: {
          task6: [
            {
              id: 'poem-t6-mock-001',
              part1:
                "Лирический герой стихотворения 'Я помню чудное мгновенье' обращается к ______________.",
              part2: '',
              answer1: 'Анне Керн',
              answer2: '',
              termId1: 'Анна Керн',
              termId2: '',
              tags: 'любовная лирика',
            },
          ],
          task7: [],
          task8: [],
          task9_1: [],
          task9_2: [],
          task10: [],
        },
        themeInternalId: 'любовь',
      },
      {
        id: 'poem-mock-002',
        title: 'Зимнее утро',
        poemId: 'poem-id-winter',
        text: '<p>Мороз и солнце; день чудесный!</p>',
        age18: false,
        tasks: {
          task6: [],
          task7: [],
          task8: [],
          task9_1: [],
          task9_2: [],
          task10: [],
        },
        themeInternalId: 'природа',
      },
    ],
  },
  {
    id: 'poet-mock-002',
    name: 'М.Ю. Лермонтов',
    authorId: 'lermontov',
    poems: [
      {
        id: 'poem-mock-003',
        title: 'Парус',
        poemId: 'poem-id-sail',
        text: '<p>Белеет парус одинокий В тумане моря голубом...</p>',
        age18: false,
        tasks: {
          task6: [
            {
              id: 'poem-t6-mock-002',
              part1: "Основная тема стихотворения 'Парус' — ______________.",
              part2: '',
              answer1: 'одиночество',
              answer2: '',
              termId1: 'одиночество',
              termId2: '',
              tags: 'философская лирика',
            },
          ],
          task7: [],
          task8: [],
          task9_1: [],
          task9_2: [],
          task10: [],
        },
        themeInternalId: 'свобода',
      },
    ],
  },
];

export const mockBlock3: Block3Data = {
  task11_1: [
    {
      id: 'b3-task11_1-mock-001',
      text: 'Сравнение образов Катерины и Ларисы в драмах А.Н. Островского',
      workId: 'Гроза',
      authorId: 'Островский',
      termId: '',
      rodId: 'литература',
      questionId: '',
      special: false,
      themeInternalId: 'сравнение',
      publicId: '',
      tags: '',
    },
    {
      id: 'b3-task11_1-mock-002',
      text: "Роль пейзажа в романе 'Евгений Онегин'",
      workId: 'Евгений Онегин',
      authorId: 'Пушкин',
      termId: '',
      rodId: 'литература',
      questionId: '',
      special: false,
      themeInternalId: 'пейзаж',
      publicId: '',
      tags: '',
    },
  ],
  task11_2_3: [
    {
      id: 'b3-task11_2_3-mock-001',
      text:
        "Согласны ли вы с мнением, что Катерина — 'луч света в темном царстве'?",
      workId: 'Гроза',
      authorId: 'Островский',
      termId: '',
      rodId: 'литература',
      questionId: '',
      special: true,
      themeInternalId: 'образ Катерины',
      publicId: '',
      tags: '',
    },
  ],
  task11_4: [
    {
      id: 'b3-11-4-mock-001',
      text:
        "Тема суда и правосудия в русской литературе XIX века (на примере произведений: А.Н. Островский 'Гроза', Ф.М. Достоевский 'Преступление и наказание', Л.Н. Толстой 'Воскресение')",
      authorIds: ['Островский', 'Достоевский', 'Толстой'],
      termId: '',
      rodId: 'литература',
      themeInternalId: 'суд, правосудие',
      publicId: '',
      tags: '',
    },
  ],
  task11_5: [
    {
      id: 'b3-11-5-mock-001',
      text: 'task11_5 литературе XIX века ...',
      authorIds: ['Островский', 'Достоевский', 'Толстой'],
      termId: '',
      rodId: 'литература',
      themeInternalId: 'суд, правосудие',
      publicId: '',
      tags: '',
    },
  ],
};

export const mockMetadata = {
  hash: 'mock-hash-2024-12-01',
  fetchedAt: new Date().toISOString(),
  computed: {
    variantsCount: 187,
    poetsCount: 2,
    totalEntities: 1543,
  },
};

export const mockKnowledgeBaseResponse: mKnowledgeBaseResponse = {
  works: mockWorks,
  poets: mockPoets,
  block3: mockBlock3,
  _metadata: mockMetadata,
};

export const mockStore = {
  works: mockWorks,
  poets: mockPoets,
  themes: [],
  lastKnownHash: mockMetadata.hash,
  hydrate: (data: mKnowledgeBaseResponse) => {
    console.log('[MockStore] Hydrate called with:', data);
  },
};
