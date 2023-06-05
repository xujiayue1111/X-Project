import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import {
  getDocList,
  getTypeItemById,
  TODO_TYPE_ALL,
  TODO_TYPE_TODAY,
  TodoDoc,
  TYPE_ALL_ID,
  TYPE_PLAN_ID,
  TYPE_SEARCH_ID,
  TYPE_TODAY_ID
} from "@/utils/typeUtils";
import { getTodayStr, isBeforeToday, isToday } from "@/utils/timeUtils";
import { delDoc } from "@/storage/type";

export const LIST_TYPE_HEADER = 1
export const LIST_TYPE_ITEM = 2
export const LIST_TYPE_FOOTER = 3

export const useCurrentTypeStore = defineStore('currentType', () => {
  const allTodoMap = ref(new Map())
  const allTodoTypeList = ref([])
  const idTodoMap = computed(() => {
    let map = new Map()
    for (const [type, itemList] of allTodoMap.value.entries()) {
      map.set(type.id, itemList)
    }
    return map
  })
  const typeMap = computed(() => {
    let map = new Map()
    for (const type of allTodoMap.value.keys()) {
      map.set(type.id, type)
    }
    return map
  })

  const countInfo = computed(() => {
    let allCount = 0
    let planCount = 0
    let todayCount = 0
    for (const [type, itemList] of allTodoMap.value.entries()) {
      allCount += type.idList.length
      for (const item of itemList) {
        if (item.done || !item.saved) {
          continue
        }
        if (item.date && item.date) {
          // 有日期
          planCount++
        }
        if (item.date && isBeforeToday(item.date)) {
          todayCount++
        }
      }
    }
    return { allCount, planCount, todayCount }
  })

  const currentTypeId = ref(TYPE_TODAY_ID)

  const item = ref(TODO_TYPE_TODAY)

  const loadData = () => {
    let map = new Map()
    for (const type of allTodoTypeList.value) {
      let todoList = getDocList(type)
      map.set(type, todoList)
    }
    allTodoMap.value = map
    updateCurrentType(getTypeItemById(allTodoTypeList.value, currentTypeId.value))
  }

  const getTodayList = () => {
    let list = reactive([])
    for (const itemList of allTodoMap.value.values()) {
      for (const item of itemList) {
        if (item.done) {
          // 事件完成就不显示
          continue
        }
        // 显示今天和今天之前的数据
        if (item.date && isBeforeToday(item.date)) {
          item.showExtra = false
          list.push(item)
        }
      }
    }
    return list
  }

  const getPlanList = () => {
    // 复用之前的代码实现添加title和添加按钮的功能
    const list = []
    const daySet = new Set()

    function addExtraItem(day) {
      // headItem表示日期Titile
      const headItem = {
        sortInfo: {
          type: LIST_TYPE_HEADER,
          date: day
        },
      }
      // footItem表示添加按钮对应一个todoItem组件
      const footItem = new TodoDoc(-1, undefined)
      footItem['sortInfo'] = {
        type: LIST_TYPE_FOOTER,
        date: day
      }
      footItem['date'] = day
      list.push(headItem)
      list.push(footItem)
    }

    for (const itemList of allTodoMap.value.values()) {
      for (const todoItem of itemList) {
        // 保存的时候需要判断日期是否变化
        if (todoItem.date && todoItem.date) {
          daySet.add(todoItem.date)
          todoItem['sortInfo'] = {
            type: LIST_TYPE_ITEM
          }
          todoItem.showExtra = false
          list.push(todoItem)
        }
      }
    }
    // 这里是用来控制显示添加按钮和title的
    let hasToday = false
    // 控制非今天的todoItem也有添加和title
    for (const day of daySet) {
      if (!hasToday) {
        hasToday = isToday(day)
      }
      addExtraItem(day)
    }
    // 没有这个无法做时间格式判断 在untils里的timeUtils里面
    if (!hasToday) {
      addExtraItem(getTodayStr())
    }
    return list
  }

  const getAllList = () => {
    let list = []
    let typeIndex = 0
    for (const typeItem of allTodoTypeList.value) {
      typeItem['sortInfo'] = {
        typeIndex,
        type: LIST_TYPE_HEADER,
      }
      list.push(typeItem)
      const todoList = allTodoMap.value.get(typeItem)
      for (const todoItem of todoList) {
        todoItem['sortInfo'] = {
          typeIndex,
          type: LIST_TYPE_ITEM
        }
        todoItem.showExtra = false
        list.push(todoItem)
      }
      const footItem = new TodoDoc(-1, typeItem.id)
      footItem['sortInfo'] = {
        typeIndex,
        type: LIST_TYPE_FOOTER,
        typeId: typeItem.id,
      }
      list.push(footItem)
      typeIndex++
    }
    return list
  }
// 搜索框操作
  const getSearchList = (key) => {
    let list = []
    let typeIndex = 0
    for (const typeItem of allTodoTypeList.value) {
      const todoList = allTodoMap.value.get(typeItem)
      let searchList = todoList.filter(item => (item.name && item.name.indexOf(key) > -1) || (item.note && item.note.indexOf(key) > -1))
    //  若找到 添加title
      if (searchList.length > 0) {
        typeItem['sortInfo'] = {
          typeIndex,
          type: LIST_TYPE_HEADER,
        }
        searchList.forEach(item => {
          item['sortInfo'] = {
            typeIndex,
            type: LIST_TYPE_ITEM
          }
        })
        list.push(typeItem)
        list.push(...searchList)
      }
      typeIndex++
    }
    return list
  }

  const addType = (type) => {
    allTodoMap.value.set(type, [])
  }

  const deleteType = (type) => {
    allTodoMap.value.delete(type)
    for (const id of type.idList) {
      delDoc(id)
    }
    for (const id of type.doneIdList) {
      delDoc(id)
    }
  }
  // 这里就是退出的的时候选中all
  const updateCurrentType = (typeItem) => {
    if (typeItem) {
      currentTypeId.value = typeItem.id
      item.value = typeItem
    } else {
      item.value = TODO_TYPE_ALL
      currentTypeId.value = item.value.id
    }
  }
  const addNewItem = (todoItem) => {
    let type = typeMap.value.get(todoItem.typeId)
    if (item.value.id === TYPE_TODAY_ID || item.value.id === TYPE_ALL_ID || item.value.id === TYPE_PLAN_ID) {
      allTodoMap.value.get(type).push(todoItem)
    }
    if (todoItem.done) {
      type.doneIdList.push(todoItem.id)
    } else {
      type.idList.push(todoItem.id)
    }
  }
  const delAllDoneItem = () => {
    item.value.doneIdList = []
  }
  const delTodoItem = (todoItem) => {
    let type = typeMap.value.get(todoItem.typeId)
    if (item.value.id === TYPE_TODAY_ID || item.value.id === TYPE_ALL_ID || item.value.id === TYPE_PLAN_ID || item.value.id === TYPE_SEARCH_ID) {
      const todoList = allTodoMap.value.get(type)
      let index = todoList.indexOf(todoItem)
      if (index >= 0) {
        todoList.splice(index, 1)
      }
    }
    let index = type.idList.indexOf(todoItem.id)
    if (index > -1) {
      type.idList.splice(index, 1)
    } else {
      index = type.doneIdList.indexOf(todoItem.id)
      if (index > -1) {
        type.doneIdList.splice(index, 1)
      }
    }
  }

  const toggleDoneStatus = (todoItem) => {
    let { idList, doneIdList } = typeMap.value.get(todoItem.typeId)
    let fromList, toList
    if (todoItem.done) {
      // 变为true：idList移到doneIdList
      fromList = idList
      toList = doneIdList
    } else {
      fromList = doneIdList
      toList = idList
    }
    let index = fromList.indexOf(todoItem.id)
    if (index > -1) {
      fromList.splice(index, 1)
      toList.push(todoItem.id)
    }
  }

  return {
    allTodoMap, allTodoTypeList, idTodoMap, typeMap,
    loadData,
    deleteType, addType,
    getTodayList, getAllList, getPlanList, getSearchList,
    countInfo,
    item, currentTypeId,
    addNewItem,
    updateCurrentType,
    delAllDoneItem,
    delTodoItem,
    toggleDoneStatus
  }
},
  {
    persist: {
      // 实现持久化变量
      paths: ['currentTypeId', 'allTodoTypeList'],
    }
  }
)