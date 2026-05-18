export type Id = string;

export interface VariantTextsSettings {
    part1Intro: string;
    part1QuestionsIntro: string;
    part1Task4Lead: string;
    part1Criteria: string;
    part1Task5Lead: string;
    part2Intro: string;
    part2QuestionsIntro: string;
    part2Task9Lead: string;
    part2Task9Criteria: string;
    part2Task10Lead: string;
    part3Intro: string;
}

export interface KnowledgeBaseSettings {
    variantTexts: VariantTextsSettings;
    weeklyVariant: any;
    weeklyPins?: Record<string, string>;
}

export const DEFAULT_KNOWLEDGE_BASE_SETTINGS: KnowledgeBaseSettings = {
    variantTexts: {
        part1Intro: 'Прочитайте приведённый ниже фрагмент художественного произведения и выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.',
        part1QuestionsIntro: 'Ответами к заданиям 1–3 являются одно-два слова или последовательность цифр.',
        part1Task4Lead: 'При написании развёрнутых ответов на задания 4 и 5 соблюдайте нормы письменной речи, приводите конкретные примеры из текста.',
        part1Criteria: 'При выполнении заданий 4 и 5 используйте термины, приводите примеры из текста и избегайте фактических ошибок. Объём ответа — 5–10 предложений.',
        part1Task5Lead: 'Дайте аргументированный связный ответ на вопрос задания.',
        part2Intro: 'Прочитайте приведённое ниже стихотворение и выполните задания 6–8, 9.1 или 9.2 (на выбор) и задание 10.',
        part2QuestionsIntro: 'Ответами к заданиям 6–8 являются одно-два слова или последовательность цифр.',
        part2Task9Lead: 'При написании развёрнутых ответов на задания 9 и 10 не искажайте авторскую позицию, приводите конкретные примеры из текста произведений, соблюдайте нормы письменной речи.',
        part2Task9Criteria: 'Выберите ОДНО из заданий: 9.1 или 9.2. Напишите прямой связный ответ: сформулируйте утверждение, аргументируйте его и приведите примеры из стихотворения.',
        part2Task10Lead: 'Дайте аргументированный связный ответ на вопрос задания 10: укажите произведение для сопоставления и подтвердите выводы примерами.',
        part3Intro: 'Выберите одну из пяти тем сочинений (11.1–11.5) и напишите развёрнутый ответ.',
    },
    weeklyVariant: null,
};

export interface ShortQuestion {
    id: Id;
    text: string;
    answer?: string;
    termId?: string;
    authorId?: string;
    tags?: string;
    isTermQuestion?: boolean;
    isActive?: boolean;
}

export interface TwoGapQuestion {
    id: Id;
    part1: string;
    part2: string;
    answer1: string;
    answer2: string;
    termId1?: string;
    termId2?: string;
    tags?: string;
    withoutAuthor?: boolean;
    isActive?: boolean;
}

export interface MatchPair {
    id: Id;
    character: string;
    tag?: string;
    properties: string[];
    propertyIds?: string[];
    phrases?: string[];
    characteristics?: string[];
}

export interface MatchingQuestion {
    id: Id;
    prompt: string;
    leftLabel: string;
    rightLabel: string;
    pairs: MatchPair[];
    extraOption?: string;
    shuffledRightOptions?: string[];
    shuffledRightOptionIds?: string[];
    termId?: string;
    authorId?: string;
    characterCount?: number;
    characterSource?: 'quotes' | 'facts' | 'mixed';
    pairPropertyType?: 'phrases' | 'characteristics';
    tags?: string;
    isActive?: boolean;
}

export interface Character {
    id: Id;
    name: string;
    tag?: string;
    quotes: string[];
    facts: string[];
}

export interface EssayQuestion {
    id: Id;
    text: string;
    termId?: string;
    authorId?: string;
    theme1Id?: string;
    theme2Id?: string;
    similarityId?: string;
    themeInternalId?: string;
    publicId?: string;
    tags?: string;
    isActive?: boolean;
}

export interface ExcerptTasks {
    excludeTask1Ids: Id[];
    excludeTask1TermIds: Id[];
    excludeTask2Ids: Id[];
    excludeTask2TermIds: Id[];
    excludeTask2Characters: string[];
    excludeTask2Properties: string[];
    excludeTask3Ids: Id[];
    excludeTask3TermIds: Id[];
    customTask1: ShortQuestion[];
    customTask2: MatchingQuestion[];
    customTask3: TwoGapQuestion[];
    task4_1: EssayQuestion[];
    task4_2: EssayQuestion[];
    task5: EssayQuestion[];
}

export interface Excerpt {
    id: Id;
    order: number;
    title: string;
    chapter?: string;
    excerptId: string;
    text: string;
    textColumns?: 1 | 2;
    textSecondColumn?: string;
    themeInternalId?: string;
    isActive?: boolean;
    tasks: ExcerptTasks;
}

export interface Work {
    id: Id;
    title: string;
    author: string;
    authorId: string;
    workId: string;
    age18: boolean;
    internalTags: string;
    externalTags: string;
    commonTasks: {
        task1: ShortQuestion[];
        task2: MatchingQuestion[];
        task3: TwoGapQuestion[];
    };
    characters: Character[];
    excerpts: Excerpt[];
}

export interface MultiSelectOption {
    id: Id;
    term: string;
    termId?: string;
    isCorrect?: boolean;
}

export interface MultiSelectQuestion {
    id: Id;
    prompt: string;
    options: MultiSelectOption[];
    termId?: string;
    tags?: string;
    isActive?: boolean;
}

export interface PoemTasks {
    task6: TwoGapQuestion[];
    task7: ShortQuestion[];
    task8: MultiSelectQuestion[];
    task9_1: EssayQuestion[];
    task9_2: EssayQuestion[];
    task10: EssayQuestion[];
}

export interface Poem {
    id: Id;
    title: string;
    poemId: string;
    text: string;
    textColumns?: 1 | 2;
    textSecondColumn?: string;
    age18: boolean;
    themeInternalId?: string;
    isActive?: boolean;
    tasks: PoemTasks;
}

export interface Poet {
    id: Id;
    name: string;
    authorId: string;
    poems: Poem[];
}

export interface Block3Question {
    id: Id;
    text: string;
    workId?: string;
    authorId?: string;
    termId?: string;
    rodId?: string;
    questionId?: string;
    special?: boolean;
    themeInternalId?: string;
    publicId?: string;
    tags?: string;
    isActive?: boolean;
}

export interface Block3QuestionMultiAuthor {
    id: Id;
    text: string;
    termId?: string;
    rodId?: string;
    authorIds: string[];
    themeInternalId?: string;
    publicId?: string;
    tags?: string;
    isActive?: boolean;
}

export interface Block3Data {
    task11_1: Block3Question[];
    task11_2_3: Block3Question[];
    task11_4: Block3QuestionMultiAuthor[];
    task11_5: Block3Question[];
}

export const INITIAL_WORKS: Work[] = [
    {
        id: 'work-1',
        title: 'А.Н. Островский «Гроза»',
        author: 'А.Н. Островский',
        authorId: 'ostrovsky',
        workId: 'groza',
        age18: false,
        internalTags: '#драма, #реализм, #XIX',
        externalTags: 'драма, реализм',
        commonTasks: {
            task1: [
                {
                    id: 'w1-t1-q1',
                    text: 'Укажите имя героини, которая стала одной из причин дуэли Павла Петровича и Базарова.',
                    answer: 'Фенечка',
                    termId: 'term-героиня',
                    tags: 'сюжет',
                },
                {
                    id: 'w1-t1-q2',
                    text: 'В каком городе происходит действие пьесы?',
                    answer: 'Калинов',
                    termId: 'term-место',
                    tags: 'сюжет',
                },
            ],
            task2: [
                {
                    id: 'w1-t2-q1',
                    prompt: 'Установите соответствие между персонажами произведения и их дальнейшей судьбой.',
                    leftLabel: 'Персонажи',
                    rightLabel: 'Дальнейшая судьба',
                    pairs: [],
                    characterCount: 3,
                    characterSource: 'mixed',
                    extraOption: 'Покинул город после скандала',
                    termId: 'term-соответствие',
                },
                {
                    id: 'w1-t2-q2',
                    prompt: 'Соотнесите персонажей с цитатами из текста.',
                    leftLabel: 'Персонажи',
                    rightLabel: 'Цитаты',
                    pairs: [],
                    characterCount: 4,
                    characterSource: 'quotes',
                    extraOption: 'Лишняя цитата',
                    termId: 'term-цитата',
                },
            ],
            task3: [
                {
                    id: 'w1-t3-bank-1',
                    part1: 'Пьеса «Гроза» относится к такому литературному направлению, как _____.',
                    part2: '',
                    answer1: 'реализм',
                    answer2: '',
                    termId1: 'term-реализм',
                    termId2: '',
                    tags: 'int-3-realism',
                },
                {
                    id: 'w1-t3-bank-2',
                    part1: 'В репликах Кабанихи часто используется _____ лексика.',
                    part2: '',
                    answer1: 'оценочная',
                    answer2: '',
                    termId1: 'term-лексика',
                    termId2: '',
                    tags: 'int-3-lexic',
                },
                {
                    id: 'w1-t3-bank-3',
                    part1: 'Главный конфликт пьесы строится на противостоянии _____ и личной свободы.',
                    part2: '',
                    answer1: 'домостроя',
                    answer2: '',
                    termId1: 'term-конфликт',
                    termId2: '',
                    tags: 'int-3-conflict',
                },
            ],
        },
        characters: [
            {
                id: 'char-1',
                name: 'Катерина',
                tag: 'главная героиня',
                quotes: ['«Отчего люди не летают?»', '«Мне нечем дышать…»'],
                facts: ['Главная героиня пьесы', 'Олицетворяет внутренний протест против домостроя'],
            },
            {
                id: 'char-2',
                name: 'Кабаниха',
                tag: 'антагонист',
                quotes: ['«Тебя бы лучше в монастырь…»'],
                facts: ['Глава семьи Кабановых', 'Символ патриархальной власти'],
            },
            {
                id: 'char-4',
                name: 'Борис',
                tag: 'любовный интерес',
                quotes: ['«Я не вольная птица»'],
                facts: ['Племянник Дикого', 'Не решается пойти против воли дяди'],
            },
            {
                id: 'char-5',
                name: 'Тихон',
                tag: 'муж Катерины',
                quotes: ['«Маменька, что ты, что ты!»'],
                facts: ['Зависим от Кабанихи', 'Сожалеет после гибели Катерины'],
            },
        ],
        excerpts: [
            {
                id: 'ex-1',
                order: 1,
                title: 'Отрывок 1 (Глава 1)',
                excerptId: 'groza-1',
                text: 'Текст отрывка…',
                tasks: {
                    excludeTask1Ids: ['w1-t1-q2'],
                    excludeTask1TermIds: [],
                    excludeTask2Ids: [],
                    excludeTask2TermIds: [],
                    excludeTask2Characters: [],
                    excludeTask2Properties: [],
                    excludeTask3Ids: [],
                    excludeTask3TermIds: [],
                    customTask1: [
                        {
                            id: 'ex1-t1-q1',
                            text: 'Почему Катерина чувствует себя одинокой в доме Кабанихи?',
                            answer: 'Отсутствие поддержки',
                            termId: 'term-конфликт',
                            tags: 'сюжет',
                        },
                    ],
                    customTask2: [],
                    customTask3: [],
                    task4_1: [
                        {
                            id: 'ex1-t4-1',
                            text: 'Можно ли сказать, что конфликт в сцене выражен через авторскую иронию?',
                            termId: 'term-ирония',
                        },
                    ],
                    task4_2: [
                        {
                            id: 'ex1-t4-2',
                            text: 'Как раскрываются характеры героев в приведённой сцене?',
                            termId: 'term-характер',
                        },
                    ],
                    task5: [
                        {
                            id: 'ex1-t5-1',
                            text: 'Сопоставьте сцену дуэли с дуэлью в «Евгении Онегине». В чём сходство или различие?',
                            theme1Id: 'theme-дуэль',
                            theme2Id: 'theme-честь',
                            similarityId: 'diff',
                            authorId: 'pushkin',
                            themeInternalId: 'theme-int-duel',
                            publicId: 'theme-pub-duel',
                        },
                    ],
                },
            },
            {
                id: 'ex-2',
                order: 2,
                title: 'Отрывок 2 (Глава 2)',
                excerptId: 'groza-2',
                text: 'Текст отрывка…',
                tasks: {
                    excludeTask1Ids: [],
                    excludeTask1TermIds: [],
                    excludeTask2Ids: ['w1-t2-q1'],
                    excludeTask2TermIds: [],
                    excludeTask2Characters: [],
                    excludeTask2Properties: [],
                    excludeTask3Ids: [],
                    excludeTask3TermIds: [],
                    customTask1: [],
                    customTask2: [],
                    customTask3: [
                        {
                            id: 'ex2-t3-bank-1',
                            part1: 'Катерина называет свои чувства _____.',
                            part2: '',
                            answer1: 'страстью',
                            answer2: '',
                            termId1: 'term-эмоция',
                            termId2: '',
                            tags: 'int-3-emotion',
                        },
                        {
                            id: 'ex2-t3-bank-2',
                            part1: 'Монолог героини — пример _____ речи.',
                            part2: '',
                            answer1: 'лирической',
                            answer2: '',
                            termId1: 'term-монолог',
                            termId2: '',
                            tags: 'int-3-monologue',
                        },
                    ],
                    task4_1: [],
                    task4_2: [],
                    task5: [],
                },
            },
        ],
    },
    {
        id: 'work-2',
        title: 'И.С. Тургенев «Отцы и дети»',
        author: 'И.С. Тургенев',
        authorId: 'turgenev',
        workId: 'fathers-sons',
        age18: false,
        internalTags: '#роман, #XIX',
        externalTags: 'роман, классика',
        commonTasks: {
            task1: [
                {
                    id: 'w2-t1-q1',
                    text: 'Кто произносит слова «Порядочный химик в двадцать раз полезнее всякого поэта»?',
                    answer: 'Базаров',
                    termId: 'term-герой',
                    tags: 'сюжет',
                },
            ],
            task2: [
                {
                    id: 'w2-t2-q1',
                    prompt: 'Соотнесите персонажей романа с их убеждениями.',
                    leftLabel: 'Персонажи',
                    rightLabel: 'Убеждения',
                    pairs: [],
                    characterCount: 3,
                    characterSource: 'facts',
                    termId: 'term-мировоззрение',
                    extraOption: 'Лишняя характеристика',
                },
            ],
            task3: [
                {
                    id: 'w2-t3-bank-1',
                    part1: 'Базаров называет себя _____.',
                    part2: '',
                    answer1: 'нигилистом',
                    answer2: '',
                    termId1: 'term-нигилизм',
                    termId2: '',
                    tags: 'int-3-nihilism',
                },
                {
                    id: 'w2-t3-bank-2',
                    part1: 'Отношение Павла Петровича к Базарову можно назвать _____.',
                    part2: '',
                    answer1: 'враждебным',
                    answer2: '',
                    termId1: 'term-конфликт',
                    termId2: '',
                    tags: 'int-3-conflict-generation',
                },
            ],
        },
        characters: [
            {
                id: 'char-3',
                name: 'Евгений Базаров',
                tag: 'нигилист',
                quotes: ['«Мы признаём полезное»'],
                facts: ['Главный герой-нигилист', 'Представитель молодого поколения'],
            },
            {
                id: 'char-6',
                name: 'Павел Петрович Кирсанов',
                tag: 'идеологический оппонент',
                quotes: ['«Принципы, милостивый государь, принципы!»'],
                facts: ['Защитник аристократических ценностей', 'Вступает в спор с Базаровым'],
            },
            {
                id: 'char-7',
                name: 'Аркадий Кирсанов',
                tag: 'молодое поколение',
                quotes: ['«Я уже не прежний Аркадий»'],
                facts: ['Друг Базарова', 'Постепенно отходит от нигилизма'],
            },
        ],
        excerpts: [
            {
                id: 'ex-3',
                order: 1,
                title: 'Отрывок 1',
                excerptId: 'fathers-1',
                text: 'Текст отрывка…',
                tasks: {
                    excludeTask1Ids: [],
                    excludeTask1TermIds: [],
                    excludeTask2Ids: [],
                    excludeTask2TermIds: [],
                    excludeTask2Characters: [],
                    excludeTask2Properties: [],
                    excludeTask3Ids: [],
                    excludeTask3TermIds: [],
                    customTask1: [],
                    customTask2: [],
                    customTask3: [],
                    task4_1: [],
                    task4_2: [],
                    task5: [],
                },
            },
        ],
    },
];

export const INITIAL_POETS: Poet[] = [
    {
        id: 'poet-1',
        name: 'В.В. Маяковский',
        authorId: 'mayakovsky',
        poems: [
            {
                id: 'poem-1',
                title: 'Хорошо!',
                poemId: 'horosho',
                text: 'Стихотворный текст «Хорошо!» (мок).\nЗдесь будет полный текст для блока 2, который показывается в варианте и редактируется в админке.',
                age18: false,
                tasks: {
                    task6: [
                        {
                            id: 'p1-t6-q1',
                            part1: 'В данном стихотворении смычок и струны — это _____.',
                            part2: 'Поэт использует _____, чтобы противопоставить чувства героев.',
                            answer1: 'иносказание',
                            answer2: 'антитеза',
                            termId1: 'term-иносказание',
                            termId2: 'term-антитеза',
                        },
                        {
                            id: 'p1-t6-q2',
                            part1: 'Ритм стихотворения передаёт ощущение _____.',
                            part2: 'Главный приём в финале — _____.',
                            answer1: 'движения',
                            answer2: 'градация',
                            termId1: 'term-ритм',
                            termId2: 'term-градация',
                        },
                    ],
                    task7: [
                        {
                            id: 'p1-t7-q1',
                            text: 'К какому роду литературы относится это стихотворение?',
                            answer: 'Лирика',
                            termId: 'term-род',
                        },
                        {
                            id: 'p1-t7-q2',
                            text: 'Какой тип рифмовки преобладает в данном фрагменте?',
                            answer: 'Перекрёстная',
                            termId: 'term-рифма',
                        },
                    ],
                    task8: [
                        {
                            id: 'p1-t8-q1',
                            prompt: 'Выберите все художественные средства, использованные в тексте.',
                            termId: 'term-тропы',
                            options: [
                                { id: 'opt-1', term: 'сравнение', termId: 'term-сравнение' },
                                { id: 'opt-3', term: 'эпитет', termId: 'term-эпитет' },
                                { id: 'opt-5', term: 'повтор', termId: 'term-повтор' },
                                { id: 'opt-7', term: 'риторический вопрос', termId: 'term-риторический' },
                            ],
                        },
                    ],
                    task9_1: [
                        {
                            id: 'p1-t9-1',
                            text: 'Как раскрывается образ героя в приведённых строках?',
                            termId: 'term-образ',
                            themeInternalId: 'poetry-9-hero',
                        },
                        {
                            id: 'p1-t9-1-2',
                            text: 'Как в стихотворении соединяются личная и общественная темы?',
                            termId: 'term-тема',
                            themeInternalId: 'poetry-9-public-private',
                        },
                    ],
                    task9_2: [
                        {
                            id: 'p1-t9-2',
                            text: 'Какое настроение доминирует в стихотворении? Обоснуйте.',
                            termId: 'term-настроение',
                            themeInternalId: 'poetry-9-mood',
                        },
                    ],
                    task10: [
                        {
                            id: 'p1-t10-1',
                            text: 'Назовите стихотворение другого автора, где показана радость встречи и тяжесть расставаний. Сравните.',
                            theme1Id: 'theme-встреча',
                            themeInternalId: 'poetry-10-meeting',
                            publicId: 'pub-10-meeting',
                        },
                        {
                            id: 'p1-t10-2',
                            text: 'Сопоставьте стихотворение с текстом о революционной эпохе у другого автора.',
                            theme1Id: 'theme-эпоха',
                            themeInternalId: 'poetry-10-era',
                            publicId: 'pub-10-era',
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'poet-2',
        name: 'Б.Л. Пастернак',
        authorId: 'pasternak',
        poems: [
            {
                id: 'poem-2',
                title: 'Гамлет',
                poemId: 'hamlet',
                text: 'Стихотворный текст «Гамлет» (мок).\nПолный текст отображается в генераторе вместо заглушки.',
                age18: false,
                tasks: {
                    task6: [],
                    task7: [
                        {
                            id: 'p2-t7-q1',
                            text: 'Какова роль театральной метафорики в стихотворении?',
                            answer: 'Раскрывает образ героя как актёра судьбы',
                            termId: 'term-метафора',
                        },
                    ],
                    task8: [
                        {
                            id: 'p2-t8-q1',
                            prompt: 'Выберите термины, применимые к стихотворению.',
                            termId: 'term-тропы',
                            options: [
                                { id: 'p2-opt-1', term: 'метафора', termId: 'term-метафора' },
                                { id: 'p2-opt-2', term: 'гипербола', termId: 'term-гипербола' },
                                { id: 'p2-opt-3', term: 'ирония', termId: 'term-ирония' },
                                { id: 'p2-opt-4', term: 'инверсия', termId: 'term-инверсия' },
                            ],
                        },
                    ],
                    task9_1: [
                        {
                            id: 'p2-t9-1',
                            text: 'Как в стихотворении раскрывается мотив одиночества?',
                            termId: 'term-мотив',
                            themeInternalId: 'poetry-9-lonely',
                        },
                    ],
                    task9_2: [
                        {
                            id: 'p2-t9-2',
                            text: 'Как меняется эмоциональный тон стихотворения от начала к финалу?',
                            termId: 'term-настроение',
                            themeInternalId: 'poetry-9-tone',
                        },
                    ],
                    task10: [
                        {
                            id: 'p2-t10-1',
                            text: 'Подберите другое стихотворение о выборе человека перед судьбой и сопоставьте.',
                            theme1Id: 'theme-choice',
                            themeInternalId: 'poetry-10-choice',
                            publicId: 'pub-10-choice',
                        },
                    ],
                },
            },
        ],
    },
];

export const INITIAL_BLOCK3: Block3Data = {
    task11_1: [
        {
            id: '11-1-1',
            text: 'Роль лирических отступлений в романе «Герой нашего времени» М.Ю. Лермонтова.',
            workId: 'hero-our-time',
            authorId: 'lermontov',
            termId: 'term-лирическое',
            rodId: 'проза',
            questionId: 'q-11-1-1',
            themeInternalId: 'essay-11-hero-time',
            publicId: 'pub-11-hero-time',
            special: true,
        },
    ],
    task11_2_3: [
        {
            id: '11-2-1',
            text: 'Что сильнее повлияло на решение Раскольникова: теория или бедность?',
            workId: 'crime-punishment',
            authorId: 'dostoevsky',
            termId: 'term-конфликт',
            rodId: 'проза',
            questionId: 'q-11-2-1',
            themeInternalId: 'essay-11-raskolnikov-choice',
            publicId: 'pub-11-raskolnikov-choice',
            special: false,
        },
        {
            id: '11-3-1',
            text: 'Какое место занимает тема поэта и поэзии в лирике символистов Серебряного века?',
            workId: 'symbolism',
            authorId: 'blok',
            termId: 'term-тема',
            rodId: 'лирика',
            questionId: 'q-11-3-1',
            themeInternalId: 'essay-11-symbolism-poet',
            publicId: 'pub-11-symbolism-poet',
            special: false,
        },
    ],
    task11_4: [
        {
            id: '11-4-1',
            text: 'В чём своеобразие звучания «русского бунта» в отечественной литературе?',
            termId: 'term-русский-бунт',
            authorIds: ['gogol', 'saltykov-shchedrin', 'sholokhov'],
            themeInternalId: 'essay-11-russian-revolt',
            publicId: 'pub-11-russian-revolt',
        },
    ],
    task11_5: [
        {
            id: '11-5-1',
            text: 'Какие советы вы бы могли дать актёру, исполняющему роль Лопахина в пьесе А.П. Чехова «Вишнёвый сад»?',
            workId: 'cherry-orchard',
            authorId: 'chekhov',
            termId: 'term-характер',
            rodId: 'пьеса',
            questionId: 'q-11-5-1',
            themeInternalId: 'essay-11-lopakhin-role',
            publicId: 'pub-11-lopakhin-role',
            special: false,
        },
    ],
};
