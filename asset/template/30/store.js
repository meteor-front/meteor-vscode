import { listAsync, saveAsync, detailAsync, delAsync } from '@/api/$$'

const state = () => {
  return {
    list: [],
    data: {},
    detail: {}
  }
}
const mutations = {
  listSync(state, payload) {
    state.list = payload
  },
  saveSync(state, payload) {
    state.data = payload
  },
  detailSync(state, payload) {
    state.detail = payload
  },
  delsync(state, payload) {
    state.data = {}
  }
}
const actions = {
  async listAsync({ commit }, params) {
    const res = await listAsync(params)
    commit('listSync', res.data.list)
    return res.data.list
  },
  async saveAsync({ commit }, data) {
    const res = await saveAsync(data)
    commit('saveSync', res.data)
    return res.data
  },
  async detailAsync({ commit }, data) {
    const res = await detailAsync(data)
    commit('detailSync', res.data)
    return res.data
  },
  async delAsync({ commit }, data) {
    const res = await delAsync(data)
    commit('delsync', res.data)
    return res.data
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
