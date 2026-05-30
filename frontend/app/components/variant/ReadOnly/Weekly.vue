<script setup lang="ts">
const { weeklyVariant, settings } = useKnowledgeBase();
const { getVariantTitle } = useVariantsStore();
</script>
<template>
  <!-- Header -->
  <div
    class="text-[#333333] w-full bg-white rounded-[10px] flex justify-center items-center p-5 mt-8 mb-3"
  >
    <h1 class="w-full font-normal text-2xl leading-7 align-center text-center">
      {{ getVariantTitle(weeklyVariant) }}
    </h1>
  </div>

  <div
    class="text-[#333333] w-full bg-white rounded-[10px] flex justify-center items-center p-3 mb-3"
  >
    <h2 class="font-normal text-xl leading-7">Часть 1</h2>
  </div>

  <div class="relative min-h-screen">
    <!-- Content -->
    <div id="variant-content" class="max-w-6xl mb-[30px]">
      <div>
        <!-- Excerpt Block -->
        <div
          class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]"
          v-if="weeklyVariant.excerpt"
        >
          <VariantTaskInstruction>
            {{ settings.variantTexts.part1Intro }}
          </VariantTaskInstruction>

          <div class="flex gap-8 mb-4">
            <div
              class="prose prose-sm max-w-none flex-1 text-justify"
              v-html="weeklyVariant.excerpt.text"
            ></div>
          </div>
          <div class="flex justify-end">
            <p class="text-base font-semibold text-gray-600">
              {{ weeklyVariant.work.author }} — «{{ weeklyVariant.work.title }}»
            </p>
          </div>
        </div>

        <!-- Tasks Section 1-3 -->
        <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
          <VariantTaskInstruction>
            {{ settings.variantTexts.part1QuestionsIntro }}
          </VariantTaskInstruction>

          <!-- Task 1 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span
                  class="text-base font-semibold leading-[20px] text-center"
                >
                  1
                </span>
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div
                    class="text-justify"
                    v-html="weeklyVariant.task1?.text"
                  />
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>

          <!-- Task 2 (Matching) -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task2"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >2</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div
                class="flex flex-col items-start gap-[10px] mb-4 ml-[55px] mr-[55px]"
              >
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task2.prompt }}
                  </div>
                </div>
                <div class="w-full grid grid-cols-2 gap-8 mb-6">
                  <!-- Left column: characters -->
                  <div>
                    <div
                      class="block text-base font-medium uppercase tracking-wider mb-2"
                    >
                      {{ weeklyVariant.task2.leftLabel }}
                    </div>
                    <div class="mb-5 py-2">
                      <div
                        v-for="(pair, idx) in weeklyVariant.task2.pairs"
                        :key="pair.id"
                        class="flex items-start gap-2 mb-2"
                      >
                        <span class="font-semibold min-w-[30px]">
                          {{ String.fromCharCode(65 + idx) }})
                        </span>
                        <span>{{ pair.character }}</span>
                      </div>
                    </div>
                    <table class="w-auto border border-gray-300">
                      <thead>
                        <tr>
                          <th
                            v-for="(pair, idx) in weeklyVariant.task2.pairs"
                            :key="idx"
                            class="border border-gray-300 p-2"
                          >
                            {{ String.fromCharCode(65 + idx) }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            v-for="(pair, idx) in weeklyVariant.task2.pairs"
                            :key="idx"
                            class="border border-gray-300 p-2 text-center"
                          >
                            &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <!-- Right column: properties -->
                  <div>
                    <div
                      class="block text-base font-medium uppercase tracking-wider mb-2"
                    >
                      {{ weeklyVariant.task2.rightLabel }}
                    </div>
                    <div class="mb-5 py-2">
                      <div
                        v-for="(pair, idx) in weeklyVariant.task2.pairs"
                        :key="pair.id"
                        class="flex items-start gap-2 mb-2"
                      >
                        <span class="font-semibold min-w-[30px]">
                          {{ idx + 1 }})
                        </span>
                        <span class="flex-1">
                          {{ pair?.characteristics[0] }}
                          <!-- {{ getPairProperty(pair) }} -->
                        </span>
                      </div>
                      <div
                        class="flex items-start gap-2 mb-2"
                        v-if="weeklyVariant.task2.extraOption"
                      >
                        <span class="font-semibold min-w-[30px]"
                          >{{ weeklyVariant.task2.pairs.length + 1 }})</span
                        >
                        <span class="flex-1">{{
                          weeklyVariant.task2.extraOption
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>

          <!-- Task 3 (Double fill-in) -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task3"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >3</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify mb-4">
                    {{ weeklyVariant.task3.part1 }}
                  </div>
                  <div class="text-justify">
                    {{ weeklyVariant.task3.part2 }}
                  </div>
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>
        </section>

        <!-- Tasks Section 4-5 -->
        <section
          class="tasks-section-2 w-full bg-white rounded-[10px] mb-3 p-[30px_40px]"
        >
          <VariantTaskInstruction>
            {{ settings.variantTexts.part1Task4Lead }}
          </VariantTaskInstruction>

          <TaskInstruction>
            {{ settings.variantTexts.part1Criteria }}
            <!-- Выберите ОДНО из заданий: 4.1 или 4.2. Напишите прямой связный ответ:
              <ul>
                <li>- отвечая на вопрос задания, сформулируйте утверждение;</li>
                <li>- аргументируйте его</li>
                <li>
                  - приведите из предложенного фрагмента текста не менее ДВУХ примеров,
                  подтверждающих сформулированное утрверждение.
                </li>
              </ul> -->
          </TaskInstruction>

          <!-- Task 4.1 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task4_1"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >4.1</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div
                  class="text-base flex-1 pt-[12px] leading-[23px] text-justify"
                  v-html="weeklyVariant.task4_1.text"
                ></div>
              </div>
            </div>
          </div>

          <!-- Task 4.2 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task4_2"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >4.2</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div
                  class="text-base flex-1 pt-[12px] leading-[23px] text-justify"
                  v-html="weeklyVariant.task4_2.text"
                ></div>
              </div>
            </div>
          </div>

          <TaskInstruction>
            {{ settings.variantTexts.part2QuestionsIntro }}
          </TaskInstruction>

          <!-- Task 5 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task5"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >5</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div
                  class="text-base flex-1 pt-[12px] leading-[23px] text-justify"
                  v-html="weeklyVariant.task5.text"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Poetry Block -->
        <div
          class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]"
          v-if="weeklyVariant.poem"
        >
          <VariantTaskInstruction>
            {{ settings.variantTexts.part2QuestionsIntro }}
          </VariantTaskInstruction>
          <div class="poem poem-sm max-w-none text-justify mb-4">
            <h3 class="text-center text-base font-semibold text-xl leading-7">
              {{ weeklyVariant.poem.title }}
            </h3>
            <div class="mt-4" v-html="weeklyVariant.poem.text" />
          </div>
          <div class="flex justify-end">
            <p class="text-base font-semibold text-gray-600">
              {{ weeklyVariant.poet.name }}
            </p>
          </div>
        </div>

        <!-- Poetry Tasks Section 6-8 -->
        <section
          class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]"
          v-if="
            weeklyVariant.task6 || weeklyVariant.task7 || weeklyVariant.task8
          "
        >
          <VariantTaskInstruction>
            {{ settings.variantTexts.part2QuestionsIntro }}
          </VariantTaskInstruction>

          <!-- Task 6 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task6"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >6</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify mb-4">
                    {{ weeklyVariant.task6.part1 }}
                  </div>
                  <div class="text-justify">
                    {{ weeklyVariant.task6.part2 }}
                  </div>
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>

          <!-- Task 7 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task7"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >7</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task7.text }}
                  </div>
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>

          <!-- Task 8  -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task8"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >8</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div
                class="flex flex-col items-start gap-[10px] ml-[55px] mr-[55px]"
              >
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task8.prompt }}
                  </div>
                </div>
                <div class="space-y-2 ml-12">
                  <div
                    v-for="(opt, idx) in weeklyVariant.task8.options"
                    :key="opt.id"
                    class="flex items-start gap-2"
                  >
                    <span class="font-semibold min-w-[30px]">
                      {{ idx + 1 }})</span
                    >
                    <span>{{ opt.term }}</span>
                  </div>
                </div>
              </div>

              <TaskAnswerStub />
            </div>
          </div>
        </section>

        <!-- Poetry Tasks Section 9-10 -->
        <section
          class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]"
          v-if="
            weeklyVariant.task9_1 ||
            weeklyVariant.task9_2 ||
            weeklyVariant.task10
          "
        >
          <VariantTaskInstruction>
            {{ settings.variantTexts.part2Task9Lead }}
          </VariantTaskInstruction>

          <TaskInstruction>
            {{ settings.variantTexts.part2Task9Criteria }}
            <!-- Выберите ОДНО из заданий: 9.1 или 9.2. Напишите прямой связный ответ:
              <ul>
                <li>— отвечая на вопрос задания, сформулируйте утверждение;</li>
                <li>— аргументируйте его;</li>
                <li>
                  — приведите из стихотворения не менее ДВУХ примеров, подтверждающих
                  сформулированное утверждение.
                </li>
              </ul> -->
          </TaskInstruction>

          <!-- Task 9.1 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task9_1"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >9.1</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task9_1.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Task 9.2 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task9_2"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >9.2</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task9_2.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Task 10 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task10"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >10</span
                >
              </div>
            </div>
            <div class="space-y-3 min-h-[50px]">
              <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
                <div class="text-base flex-1 pt-[12px] leading-[23px]">
                  <div class="text-justify">
                    {{ weeklyVariant.task10.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Part 2 -->
        <div
          class="w-full bg-white rounded-[10px] flex justify-center items-center p-3 mb-3"
        >
          <h2 class="font-normal text-xl leading-7">Часть 2</h2>
        </div>

        <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
          <VariantTaskInstruction>
            {{ settings.variantTexts.part3Intro }}
            <!-- <p>
                    Выберите только ОДНУ из пяти предложенных тем сочинений (11.1–11.5).
                  </p>
                  <p>Напишите сочинение, соблюдая следующие требования:</p>
                  <ol>
                    <li>
                      Сформулируйте не менее трёх аргументированных утверждений,
                      раскрывающих тему (не искажайте авторской позиции).
                    </li>
                    <li>
                      Подтвердите сформулированные утверждения конкретными примерами из
                      текста произведения(-ий); объясните, как эти примеры подтверждают
                      утверждения, раскрывающие тему.
                    </li>
                    <li>
                      Опирайтесь на теоретико-литературные понятия (или искусствоведческие —
                      в сочинении на тему 11.5), не менее двух понятий используйте для
                      анализа текста произведения(-ий).
                    </li>
                    <li>Соблюдайте логику рассуждения, избегайте отступления от темы.</li>
                    <li>
                      Пишите разборчивым почерком; соблюдайте речевые, орфографические,
                      пунктуационные и грамматические нормы.
                    </li>
                    <li>
                      В сочинении должно быть не менее 200 слов (при меньшем объёме за
                      сочинение выставляется 0 баллов).
                    </li>
                  </ol>
                  <p>
                    Не допускается обращения к произведениям со спорной принадлежностью к
                    художественной литературе.
                  </p> -->
          </VariantTaskInstruction>
          <!-- Task 11.1 - 11.5 -->
          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task11_1"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >11.1</span
                >
              </div>
            </div>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <div class="text-base flex-1 pt-[12px] leading-[23px]">
                <div class="text-justify">
                  {{ weeklyVariant.task11_1.text }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task11_2"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >11.2</span
                >
              </div>
            </div>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <div class="text-base flex-1 pt-[12px] leading-[23px]">
                <div class="text-justify">
                  {{ weeklyVariant.task11_2.text }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task11_3"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >11.3</span
                >
              </div>
            </div>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <div class="text-base flex-1 pt-[12px] leading-[23px]">
                <div class="text-justify">
                  {{ weeklyVariant.task11_3.text }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task11_4"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >11.4</span
                >
              </div>
            </div>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <div class="text-base flex-1 pt-[12px] leading-[23px]">
                <div class="text-justify">
                  {{ weeklyVariant.task11_4.text }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
            v-if="weeklyVariant.task11_5"
          >
            <div
              class="absolute left-0 top-0 p-[30px] flex items-center justify-center"
            >
              <div
                class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
              >
                <span class="text-base font-semibold leading-[20px] text-center"
                  >11.5</span
                >
              </div>
            </div>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <div class="text-base flex-1 pt-[12px] leading-[23px]">
                <div class="text-justify">
                  {{ weeklyVariant.task11_5.text }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
