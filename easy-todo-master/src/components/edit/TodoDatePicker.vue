<template>
  <!-- 通过ref传递数据 -->
  <div ref="rootRef">
    <!-- 点击会弹出 支持编辑日期 -->
    <el-date-picker
      ref="dataPickerRef"
      v-model="date"
      placeholder="添加日期"
      size="small"
      :prefix-icon="datePrefix"
      :clear-icon="dateClearIcon"
      @blur="isActive = false"
      @focus="isActive = true"
      value-format="YYYY-MM-DD"
      :format="dateFormat">
    </el-date-picker>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { computed, h, onBeforeUnmount, onMounted, ref } from "vue";
import { getSpecialDateStr } from "@/utils/timeUtils";

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
const date = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const dataPickerRef = ref(null)
const rootRef = ref(null)
const isActive = ref(false)

const datePrefix = computed(() => {
  return h('img', {
    src: `src/assets/svg/ic_calendar_${ isActive.value ? '' : 'un' }selected.svg`,
    class: "icon",
    alt: ""
  })
})

const dateClearIcon = h('img', {
  src: "src/assets/svg/ic_delete.svg",
  class: "icon",
  alt: ""
})
// 格式检查 不合格的格式不予改变
const dateFormat = computed(() => {
  let dateStr = getSpecialDateStr(date.value)
  if (dateStr) {
    return dateStr
  }
  return 'YYYY/MM/DD'
})
// 昨天今天明天进行显示
let changeListener = () => {
  const input = rootRef.value.getElementsByTagName('input')[0]
  let inputValue = input.value.trim()
  if (inputValue === '今天') {
    date.value = dayjs().format()
    dataPickerRef.value.handleClose()
    return
  }
  if (inputValue === '明天') {
    date.value = dayjs().add(1, 'day').format()
    dataPickerRef.value.handleClose()
    return
  }
  if (inputValue === '昨天') {
    date.value = dayjs().add(-1, 'day').format()
    dataPickerRef.value.handleClose()
  }
}
// 昨天今天明天进行显示
onMounted(() => {
  const input = rootRef.value.getElementsByTagName('input')[0]
  input.addEventListener('change', changeListener)
})

onBeforeUnmount(()=>{
  const input = rootRef.value.getElementsByTagName('input')[0]
  input.removeEventListener('change', changeListener)
})
</script>
<style scoped lang="scss">
:deep(.el-date-editor.el-input, .el-date-editor.el-input__wrapper) {
  width: 120px;
  height: 22px;

  .el-input__wrapper {
    box-shadow: none;
    background-color: var(--todo-bg-label);
    border-radius: 4px;

    .icon {
      width: 10px;
      height: 10px;
    }

    .el-input__inner {
      font-size: 13px;
      color: var(--todo-black1);
    }
  }
}
</style>