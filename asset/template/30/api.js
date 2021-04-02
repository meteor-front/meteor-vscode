import request from '@/utils/request'

// 列表
export function listAsync(params) {
  return request.get('/demo/list', {
    params
  })
}
// 保存
export function saveAsync(data) {
  return request.post('/demo/save', data)
}
// 详情
export function detailAsync(data) {
  return request.get('/demo/detail', data)
}
// 删除
export function delAsync(id) {
  return request.put(`/demo/${id}`)
}
