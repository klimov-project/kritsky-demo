<script setup lang="ts">
import { PRIVACY_PAGE_DOCUMENT as document } from '~/utils/const';
</script>

<template>
  <div class="w-full flex flex-col items-center min-h-screen py-20 px-4">
    <div class="w-full max-w-[800px]">
      <h1 class="font-serif font-bold text-3xl mb-10 text-[#221E20]">
        {{ document.title }}
      </h1>

      <div
        class="font-serif text-[#221E20] opacity-80 space-y-6 leading-relaxed text-[18px]"
      >
        <p>{{ document.intro }}</p>

        <section
          v-for="section in document.sections"
          :key="section.title"
          class="space-y-4"
        >
          <h2 class="font-bold text-xl pt-4 opacity-100">
            {{ section.title }}
          </h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">
            {{ paragraph }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
