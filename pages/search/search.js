// pages/search/search.js
/*var common = require('../common/common.js');*/
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchList:[],
    RecordList:[],
    currentValue:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    if (options.search!=undefined){
      this.setData({
        currentValue: options.search
      })
    }
    //更新当前的搜索历史
    try {
      var value = wx.getStorageSync('RecordList')
      if (value) {
        let record = value.split(",")
        this.setData({
          RecordList: record.filter(that.current, record)
        })
      }
    } catch (e) {
      // Do something when catch error
    }
    
 
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
  bindKeyInput:function(e){
    let that = this;
    let word = e.detail.value;
    this.setData({
      currentValue: e.detail.value
    })
    //发出请求动态匹配当前数据
    //初次加载的时候获取接口
    wx.request({
      url: app.globalData.HostM +'/zixun/search_sugword/', //仅为示例，并非真实的接口地址
      data: {
        query: word
      },
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded"  //post
      },

      complete: function (res) {

      },
      success: function (res) {
        if (res.statusCode == 200) {
          let currentList = res.data.filter(that.current, res.data)
          //对该数组进行替换
          for (var i = 0; i < currentList.length; i++) {
            currentList[i] = that.keyColor(currentList[i], that.data.currentValue)
          }
          that.setData({
            searchList: currentList
          });
        }

      }
    })
  },
  //截取前6个数据
  current: function (num,index) {
    return index<6;
  },
  cancel: function (){
    let val = this.data.currentValue;
    //有值的时候清除值，没有值的时候会到首页
    if (val === undefined || val===""){
      wx.switchTab({
        url: '../index/index'
      })
    }else{
      this.setData({
        currentValue: ""
      })
    }
  },
  //改变关键字的颜色
  keyColor:function(value,keyWord){
    let index = value.indexOf(keyWord)
    let len = keyWord!="" ? keyWord.length:0;
    let valfirst = value.substr(0, index)
    let vallast = value.substr(index + len)
    return  vallast;
  },
  //删除当前的一条记录
  deleteRecord:function(e){
    console.log(this.data.RecordList)
    console.log(e.target)
    let keyWord = e.target.dataset.word;

    let len = keyWord.length;
    let recordStr = wx.getStorageSync('RecordList');
    let index = recordStr.indexOf(keyWord);
    if (index===0){
      index = index+1;
    }
    let res = recordStr.substring(0, index-1) + recordStr.substring(index + len, recordStr.length)
    wx.setStorageSync('RecordList', res)
    this.setData({
      RecordList: res==="" ?[]: res.split(",")
    })
  }

})