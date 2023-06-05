
import { useTypeStore } from "@/store/type";
import { TodoDoc } from "@/utils/typeUtils";

export const createType = (typeInfo) => {
  // typeInfo  { colorIndex: 1, svgIndex: 0, name: 'name1', count: 2, id: 1 },
  let res = { ...typeInfo, idList: [], doneIdList: [] }
  console.log('creatType', typeInfo, res)
  return Promise.resolve(res)
}

export function createTodoDoc(typeId, otherInfo) {
  return new TodoDoc(useTypeStore().incrementDocId(), typeId, otherInfo)
}