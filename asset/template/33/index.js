const { regeneratorRuntime, api, util } = global;
const app = getApp();
import { appId } from '../../utils/constant'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchVal: '',
    page: { // 分页信息
      limit: 10,
      page: 1,
      kw: ''
    },
    productList: [] // 商品列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.queryList()
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
  // 搜索商品
  searchShop(e) {
    this.setData({
      page: {
        page: 1,
        limit: 10,
        kw: e.detail
      },
      productList: []
    })
    this.queryList()
  },
  // 查询列表
  async queryList() {
    let res = await api.shop.getProductList(this.data.page)
    if (res.code === 0) {
      this.setData({
        productList: this.data.productList.concat(res.data.list),
        page: {
          ...this.data.page,
          page: ++this.data.page.page
        }
      })
    }
  },
  // 去认领页面
  getShop(e) {
     wx.navigateTo({
       url: '/pages/shop/shopAdd?id=' + e.currentTarget.dataset.id
     });
  }
})