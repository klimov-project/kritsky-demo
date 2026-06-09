<script setup lang="ts"></script>

<template>
  <footer class="pt-[clamp(56px,8vh,72px)] pb-[24px] text-[#333]">
    <div class="mx-auto max-w-[1440px] px-4 lg:px-8">
      <!-- Desktop Footer -->
      <div
        class="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-[16px]"
      >
        <div class="flex flex-col items-start gap-[6px] text-[14px]">
          <NuxtLink to="/about" class="nav-link-animated transition-opacity"
            >О проекте</NuxtLink
          >
          <NuxtLink to="/terms" class="nav-link-animated transition-opacity"
            >Пользовательское соглашение</NuxtLink
          >
          <NuxtLink to="/privacy" class="nav-link-animated transition-opacity"
            >Политика конфиденциальности</NuxtLink
          >
        </div>
        <div class="flex items-center justify-center gap-[5px]">
          <a
            href="https://www.youtube.com/@romankritsky"
            class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconYT />
          </a>
          <a
            href="https://t.me/romankritsky"
            class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconTG />
          </a>
        </div>
        <div
          class="justify-self-end text-right text-[14px] leading-[1.45] flex flex-col items-start gap-[6px] text-[14px]"
        >
          <p>ИП Крицкий Роман Дмитриевич</p>
          <p>ИНН: 772796119977</p>
          <p>ОГРНИП: 325774600403322</p>
        </div>
      </div>
      <div class="hidden lg:block mt-[52px] text-center text-[14px]">
        Все права защищены. © Крицкий 2026
      </div>

      <!-- Mobile Footer -->
      <div class="lg:hidden">
        <div class="grid mb-8 grid-cols-2 gap-[20px] items-start">
          <div class="flex flex-col gap-[4px] text-[13px]">
            <NuxtLink to="/about">О проекте</NuxtLink>
            <NuxtLink to="/terms">Пользовательское соглашение</NuxtLink>
            <NuxtLink to="/privacy">Политика конфиденциальности</NuxtLink>
          </div>
          <div class="text-right text-[12px] leading-[1.9] lg:leading-[1.35]">
            <p>ИП Крицкий Роман Дмитриевич</p>
            <p>ИНН: 772796119977</p>
            <p>ОГРНИП: 325774600403322</p>
          </div>
        </div>
        <div class="mt-[16px] flex items-end justify-between">
          <div class="text-[12px]">
            <p>© Крицкий 2026</p>
            <p>Все права защищены.</p>
          </div>
          <div class="flex gap-[5px]">
            <a
              href="https://www.youtube.com/@romankritsky"
              class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconYT />
            </a>
            <a
              href="https://t.me/romankritsky"
              class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconTG />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
