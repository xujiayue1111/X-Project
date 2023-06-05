<template>
  <div class="edit-item-root" ref="refItem">
    <div v-if="showAdd" class="add" @click="onClickSpan">
      <div class="line line-x" />
      <div class="line line-y" />
    </div>
    <!-- 最左侧的radio -->
    <label v-else class="radio">
      <!-- radio来确定要不要更新数据  点击的话就会更新 不点击不更新 当然整个收起也会触发数据的更新 -->
      <input type="checkbox" v-model="cacheData.done">
      <!-- 这个是控制按钮选中或者不选中的效果的 下面css里面有显示 -->
      <div class="checkmark" />
    </label>
    <div class="info-layout">
      <!-- todo的名字 -->
      <input class="input-item name" type="text" v-model="cacheData.name" ref="refNameInput" @click.stop="onClickSpan"
        @keydown.enter="onNameInputEnter($event)">
      <!-- 展开和收起使用这个组件实现动画 名字不展开收起就不放这个组件里面 -->
      <el-collapse-transition>
        <div v-show="showExtra || note.length > 0">
          <!-- todo的备注 有个placeholder留下默认值-->
          <!-- 多行输入最多五行最少一行 -->
          <el-input class="remark" type="textarea" placeholder="备注" :autosize="{ minRows: 1, maxRows: 5 }"
            @click.stop="onClickSpan" v-model="cacheData.note" ref="refNoteInput">
          </el-input>
        </div>
      </el-collapse-transition>
      <el-collapse-transition>
        <div v-if="showExtra" class="other-info">
          <!-- 日期选择器 这个是个组件 -->
          <todo-date-picker v-model="cacheData.date" />
          <!-- 时间选择器 这个是个组件 -->
          <todo-time-picker class="label-right" v-model="cacheData.timer"
            :style="`display: ${cacheData.date ? 'block' : 'none'} `" />
          <!-- 分组按钮# -->
          <div class="label-layout label label-right">#</div>
          <!-- 小旗子按钮flag -->
          <div class="label-layout flag label-right" @click="cacheData.isFlag = !cacheData.isFlag">
            <img :src="`src/assets/svg/ic_flag${isFlag ? '_selected' : ''}.svg`" alt="">
          </div>
        </div>
      </el-collapse-transition>
      <template v-if="!showExtra && (extraTypeName || extraTime) && !showAdd">
        <!-- 给今天加的  多一个type和时间 -->
        <div class="extra_content">
          <span v-if="extraTypeName">{{ extraTypeName }}</span>
          <span v-if="extraTime" :class="extraContentClass" @click.stop="onClickSpan">{{ extraTime }}</span>
        </div>
      </template>
      <div class="divider" />
    </div>
  </div>
</template>
<script setup>
import TodoDatePicker from "@/components/edit/TodoDatePicker.vue";
import TodoTimePicker from "@/components/edit/TodoTimePicker.vue";
import { defineAttrFromProps } from "@/utils/vueUtils";
import { computed, reactive, ref, watch } from "vue";
import { getSpecialDateStr, isExpire } from "@/utils/timeUtils";

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  },
  timer: {
    type: String,
    default: ''
  },
  isFlag: {
    type: Boolean,
    default: false,
  },
  done: {
    type: Boolean,
    default: false,
  },
  showExtra: {
    type: Boolean,
    default: false,
  },
  typeName: {
    type: String,
    default: '',
  },
  addInfo: {
    type: Object,
  },
  showAdd: {
    type: Boolean,
    default: false,
  }
})
const emit = defineEmits([
  'update:name',
  'update:note',
  'update:date',
  'update:timer',
  'update:isFlag',
  'update:done',
  'update:showExtra',
  'update:addInfo',
  'itemChange',
])

function defineAttr(key, notifyChange = true) {
  return defineAttrFromProps(props, emit, key, notifyChange ? 'itemChange' : null)
}

const cacheData = reactive({
  name: props.addInfo ? props.addInfo.name : props.name,
  note: props.addInfo ? props.addInfo.note : props.note,
  date: props.date,
  timer: props.addInfo ? props.addInfo.timer : props.timer,
  isFlag: props.addInfo ? props.addInfo.isFlag : props.isFlag,
  done: props.addInfo ? props.addInfo.done : props.done,
})

function watchProps(key) {
  watch(() => props[key], (value) => {
    cacheData[key] = value
  })
}

watchProps('name')
watchProps('note')
watchProps('date')
watchProps('isFlag')
watchProps('done')
// 通过wach来监听cacheData也就是当前的数据 检查当前数据和之前的数据有没有区别 有区别就更新
watch(() => cacheData.done, (done) => {
  if (!showExtra.value) {
    emit('update:done', done)
  }
})

const refNameInput = ref(null)
const refNoteInput = ref(null)
const showExtra = defineAttr('showExtra', false)
let changedData = null

watch(() => props.showExtra, (show) => {
  if (show) {
    if (!isFocused()) {
      // 只有当前todoItem、没有焦点时才聚焦到name
      refNameInput.value.focus()
    }
  } else {
    changedData = null
    for (const key in cacheData) {
      if (props[key] === cacheData[key]) {
        continue
      }
      if (!changedData) {
        changedData = {}
      }
      changedData[key] = true
      emit('update:' + key, cacheData[key])
    }
  }
})


/**
 * 当前todoItem是否有焦点
 * @returns {boolean}
 */
function isFocused() {
  let activeElement = document.activeElement
  // 要不就聚焦到备注里要不就聚焦到name里 不过肯定先聚焦到name里
  return activeElement && (refNoteInput.value.ref === activeElement || refNameInput.value === activeElement)
}

const extraTypeName = computed(() => {
  if (!props.typeName) {
    return ''
  }
  if (cacheData.name) {
    return props.typeName + ' - '
  } else {
    return props.typeName
  }
})
// 计算属性追踪今天的时间
const extraTime = computed(() => {
  if (!cacheData.date) {
    return ''
  }
  let dateStr = getSpecialDateStr(cacheData.date)
  if (!dateStr) {
    dateStr = cacheData.date
  }
  if (cacheData.timer) {
    return dateStr + ' ' + cacheData.timer
  }
  return dateStr
})

const extraContentClass = computed(() => {
  let expire = isExpire(cacheData.date, cacheData.timer)
  return { expire }
})

function onClickSpan() {
  // 这里的showExtra控制点击todo展开点击其他地方收起
  showExtra.value = true
}

function onNameInputEnter(ev) {
  if (ev.isComposing) {
    return
  }
  showExtra.value = false
}

const refItem = ref(null)
defineExpose({
  getItemElement() {
    return refItem.value
  },
  getChangedData() {
    return changedData
  }
})
</script>
<style scoped lang="scss">
.edit-item-root {
  display: flex;

  .add {
    margin: 7px 16px 0;
    position: relative;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--todo-gray3);

    &:active {
      background-color: #9b9b9b;
    }

    .line {
      position: absolute;
      left: 50%;
      top: 50%;
      background-color: white;

      &.line-x {
        width: 10px;
        height: 2px;
        margin-left: -5px;
        margin-top: -1px;
      }

      &.line-y {
        width: 2px;
        height: 10px;
        margin-left: -1px;
        margin-top: -5px;
      }
    }
  }

  .radio {
    margin: 7px 16px 0;
    position: relative;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    user-select: none;
    border: 1px solid var(--todo-blue);
    display: block;

    input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      // 用的是伪元素加个绝对定位进行颜色的填充
      &:after {
        content: '';
        position: absolute;
        top: 20%;
        left: 20%;
        background-color: var(--todo-blue);
        width: 60%;
        height: 60%;
        border-radius: 50%;
        transform: scale(0);
        transition: 100ms ease;
      }
    }
  }

  .radio input:checked~.checkmark:after {
    transform: scale(1);
  }

  .info-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 13px;

    .input-item,
    :deep(.el-textarea__inner) {
      display: inline-block;
      background: none;
      border: none;
      outline: none;
      line-height: 18px;
      width: 100%;
      font-size: inherit;
      padding: 0;

      &::placeholder {
        font-size: inherit;
        color: var(--todo-gray2);
        border: none;
        outline: none;
        box-shadow: none;
      }

      &.name {
        color: var(--todo-black1);
        height: 18px;
        margin-top: 7px;
      }
    }

    :deep(.el-textarea__inner) {
      color: var(--todo-gray4);
      resize: none;
      box-shadow: none;
    }

    .other-info {
      margin-top: 2px;
      height: 22px;
      display: flex;
      font-size: inherit;

      .label-layout {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 22px;
        padding: 0 6px;
        background-color: var(--todo-bg-label);
        border-radius: 4px;
        color: #2C3E50;

        &.label {
          color: var(--el-input-placeholder-color);
        }

        &.flag {
          padding: 0 3px;

          img {
            width: 14px;
            height: 14px;
          }
        }
      }

      .label-right {
        margin-left: 8px;
      }
    }

    .extra_content {
      height: 18px;
      font-size: inherit;
      color: var(--el-text-color-placeholder);

      .expire {
        color: #fb4743;
      }
    }

    .divider {
      height: 1px;
      width: 100%;
      background-color: var(--divider-gray2);
      margin-top: 6px;
    }
  }
}
</style>