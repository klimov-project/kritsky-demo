<script setup lang="ts"></script>
<template>
  <div class="task-instruction-wrapper text-default">
    <p class="task-instruction">
      Прочитайте приведённый ниже фрагмент художественного произведения и
    </p>
    <p class="task-instruction">
      выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.
    </p>
  </div>
</template>
<style lang="scss">
.task-instruction {
  text-align: left;
  font-size: 20px;
  white-space: normal;
  font-kerning: auto;
  font-feature-settings: normal;
  font-optical-sizing: auto;

  &-wrapper {
    box-sizing: border-box;
    background: #f6f6f6;
    border: 1px solid #333333;
    border-radius: 5px;
    padding: 14px 40px;
    margin-bottom: 40px;
  }
}
</style>
