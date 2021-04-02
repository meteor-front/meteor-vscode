const { regeneratorRuntime, api, util } = global;
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop: {
      price: 1
    },
    showAction: false,
    action: [],
    actionType: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  // 改变数值
  onChange(e) {
    let data = {}
    data[e.currentTarget.dataset.name] = e.detail
    console.log(e.currentTarget.dataset.name)
    console.log(e.detail)
    this.setData(data)
  },
  // 显示action
  onDisplayAction(e) {
    let name = e.currentTarget.dataset.name
    this.setData({
      actionType: name,
      action: this.data.actions[name],
      showAction: true
    })
  },
  // 关闭action
  onCloseAction() {
    this.setData({
      showAction: false
    })
  },
  // 关闭action
  onCloseAction() {
    this.setData({
      showAction: false
    })
  },
  // 选择action
  onSelectAction(e) {
    let data = {}
    data[this.data.actionType] = e.detail.name
    this.setData(data)
    this.onCloseAction()
  }
})