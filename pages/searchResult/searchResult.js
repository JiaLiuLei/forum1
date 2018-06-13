// pages/searchResult/searchResult.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageIndex: 1,
    pageCount:10,
    keyWord:"",
    status: 0,
    itemList:[],
    RecordList:[],
    inputValue:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    //结果页获取上个页面传来的关键词，并且记录到历史记录当中去
    if (options.search!=undefined){
      this.setData({
        keyWord: decodeURIComponent(options.search)
      })
      //更新到历史记录
      let that = this;
      //判断当前的缓存是否为空，为空则添加
      let RecordList = that.data.RecordList;
      try {
        var value = wx.getStorageSync('RecordList')
        if (value) {
          // Do something with return value
          RecordList = value.split(",");
        }
      } catch (e) {
        // Do something when catch error
      }

      RecordList.unshift(options.search)
      try {
        wx.setStorageSync('RecordList', that.dedupe(RecordList).toString());
      } catch (e) {
      }
    }
  },
  //数组去重的方法
  dedupe: function (array) {
    return Array.from(new Set(array));
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
    let that = this;
    that.moreData();
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
    //下拉的时候需要把当前的状态重置
    //重新拉取最新的的数据
    let that = this;
    wx.showLoading({
      title: '加载中',
      success: function () {
        that.setData(
            {
              status: 0,
              pageIndex:1
            }
        );
        that.moreData();
        setTimeout(function(){
          wx.hideLoading()
        },500)
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let that =this;
    let nextPage = this.data.pageIndex+=1;
    wx.showLoading({
      title: '加载中',
      success: function () {
        that.setData(
            {
              status: 1,
              pageIndex:nextPage
            }
        );
        that.moreData();
        setTimeout(function(){
          wx.hideLoading()
        },500)
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title:"搜索结果"
    }
  },
  moreData: function () {
    //封装第一次请求，刷新，下一步请求
    let that = this;
    let pageIndex = that.data.pageIndex;
    let pageCount = that.data.pageCount;
    let pageWord = that.data.keyWord;
    wx.request({
      url: app.globalData.HostM + '/zixunApi/searchList/',
      data: {
        type: "tiezi",
        keyword: pageWord,
        title_type: 1,
        page: pageIndex,
        pagesize: pageCount,
        needcount:1
      },
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded"  //post
      },
      complete: function (res) {
        //判断当前的状态值，如果是1的话，就追加//少了总数的，周一的时候记得问下
      },
      success: function (res) {
        let currenList = res.data.list;
        // for (let i = 0; i < currenList.length;i++)
        // {
        //   currenList[i].title = currenList[i].title.replace(/<b/g,"<text").replace("</b>","</text>")
        // }
        if (res.statusCode == 200) {
          if (that.data.status === 0) {
            that.setData({
              itemList: currenList,
              status: 1
            });
          } else {
            let count = parseInt(res.data.total)
            let currentCount = parseInt(pageIndex) * parseInt(pageCount)
            if (count > currentCount) {
              that.data.itemList.push(...currenList)
              that.setData({
                itemList: that.data.itemList
              });
            } else {
              wx.showToast({
                title: "没有更多了",
                icon: 'none',
                duration: 1000
              })
            }
          }
        }

      }
    })
  }
})
