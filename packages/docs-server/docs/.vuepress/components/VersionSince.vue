<script setup lang="ts">
const { version } = defineProps(['version']);
</script>

<template>
  <span class="badge">
    {{ version }} 或以上
  </span>
</template>

<style scoped>
.dark .badge {
  color: rgb(240, 240, 240);
  background-color: #3aa675;
}

.badge {
  vertical-align: middle;

  background-color: #3eaf7c;
  color: #fff;
  border: 0px;
  -webkit-tap-highlight-color: #0000;

  font-size: 13px;
  height: 24px;
  line-height: 18px;

  padding: 0px 12px;

  display: inline-flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;

  width: auto;
  border-radius: 8px;
  font-weight: bold;
  text-overflow: ellipsis;
  overflow: hidden;
  box-sizing: border-box;
  -webkit-box-flex: 0;
  flex-grow: 0;

  cursor: default;
}
</style>
