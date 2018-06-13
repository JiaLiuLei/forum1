//index.js
var common = require('../../common/common.js');
const app = getApp();
Page({
  data: {
    page_index: 0,
    page_count: 1,
    status: 0,
    itemList:[],
    isSpread:false,
    back:true
  },
  onLoad: function (options) {
    var that=this;
    that.link='';
    common.login(function(userInfo){
      that.setData({
        itemList: [],
        page_index: 0,
        page_count: 1,
        userInfo: userInfo
      });
      that.searchTop();
      that.itemList();
      that.addTie();
      common.circleIcon(function (data) {
        that.setData({
          circleIcon: data
        })
      }, userInfo);
    });
  },
  onShow:function(){
    if(wx.getStorageSync('isFt')){
      var that=this;
      that.link='';
      common.login(function(userInfo){
        that.setData({
          itemList: [],
          page_index: 0,
          page_count: 1,
          userInfo: userInfo
        });
        that.searchTop();
        that.itemList();
        that.addTie();
        common.circleIcon(function (data) {
          that.setData({
            circleIcon: data
          })
        }, userInfo);
      });
      wx.removeStorageSync('isFt');
    }
  },
  onHide:function(){
    this.setData({
      isSpread:false
    })
  },
  sendFn:function(){
    var that=this;
    that.setData({
      btn_hover:true
    })
  },
  closeSend:function(){
    var that=this;
    that.setData({
      btn_hover:false
    })
  },
  switchMenu:function(e) {
    this.setData({
      isSpread: !this.data.isSpread
    })
    common.collectData(app.globalData.userInfo, e.detail.formId, function () { })
  },
  sendPost:function(e){
    var that=this;
    that.link= e.currentTarget.dataset.link;
    common.login(function(userInfo){
      if(userInfo === "unlogin"){
        that.setData({
          isLoginShow:true
        })
      }else{
        wx.navigateTo({
          url: that.link
        });
      }
    });
  },
  loginClose:function(e){
    this.setData({
      isLoginShow:false
    })
  },
  getUserInfo:function(){
    var that=this;
    common.login(function(userInfo){
      if(userInfo!=='unlogin'){
        wx.navigateTo({
          url: that.link
        });
      }
      that.setData({
        isLoginShow:false
      });
    });
  },
  addTie:function(){
    var that=this;
    var header = {
      'source-from': app.globalData.sourceFrom
    }
    if (that.data.userInfo.userinfo) {
      header['device-id'] = that.data.userInfo.userinfo.openId;
      header['userid'] = that.data.userInfo.third_user_id;
    }
    wx.request({
      url: app.globalData.Host + '/new-note/increase-statistics',
      data: {
        timestamp:wx.getStorageSync('time')||that.timeStamp()
      },
      header: header,
      success: function (res) {
        if (res.data.increase_count!==0) {
          that.setData({
            increase_count: res.data.increase_count||0
          });
          setTimeout(function(){
            that.setData({
              increase_count: 0
            });
          },2000);
          wx.setStorageSync('time',that.timeStamp());
        }
      },
      fail: function (res) {

      },
      complete: function () {
        //显示出加载中的提示
      }
    })
  },
  timeStamp: function(){
    const date=new Date();
    const year = date.getFullYear();
    const month= parseInt(date.getMonth() + 1) < 10 ? "0" + parseInt(date.getMonth() + 1) : parseInt(date.getMonth() + 1);
    const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    const minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    const str=year+""+month+""+day+""+hour+""+minute+""+second;
    return str;
  },
  searchTop:function(){
    var that=this;
    var header = {
      'source-from': app.globalData.sourceFrom
    }
    if (that.data.userInfo.userinfo) {
      header['device-id'] = that.data.userInfo.userinfo.openId;
      header['userid'] = that.data.userInfo.third_user_id;
    }
    wx.request({
      url: app.globalData.Host + '/new-note/search/top',
      data: {
        page_index: 0,
        page_size: 3
      },
      header: header,
      method: 'POST',
      dataType: 'json',
      success: function (res) {
        if (!res.data.records) {
          return false;
        }
        that.setData({
          topList: res.data.records
        });
      },
      fail: function (res) {

      },
      complete: function () {
        //显示出加载中的提示
      }
    })
  },
  itemList:function(){
    var that=this;
    var header={
      'source-from': app.globalData.sourceFrom
    }
    if(that.data.userInfo.userinfo){
      header['device-id']=that.data.userInfo.userinfo.openId;
      header['userid']=that.data.userInfo.third_user_id;
    }
    that.setData({
      status:0
    });
    wx.showLoading({
      title:'加载中',
      success: function () {
        wx.request({
          url: app.globalData.Host + '/new-note/search',
          data: {
            page_index: that.data.page_index,
            page_size: 20
          },
          header:header,
          method: 'POST',
          dataType: 'json',
          success: function (res) {
            if (!res.data.records) {
              return false;
            }
            // 当前页码
            var page_index = parseInt(that.data.page_index) + 1;
            // 总条数
            var page_count = Math.ceil(res.data.total_records / 20);
            var itemList = that.data.itemList;
            var datas = res.data.records||[];
            const obj = {};
            obj.status=1;
            obj.page_index=page_index;
            obj.page_count=page_count
            let a = 0;
            for (let i = itemList.length; i < (itemList.length + datas.length); i++) {
              obj[`itemList[${i}]`] = datas[a];
              a++;
            }
            //去除重复的数据
            var hash = {};
            itemList = itemList.reduce(function(item, next) {
              hash[next.id] ? '' : hash[next.id] = true && item.push(next);
              return item
            }, []);
            that.setData(obj);
            wx.hideLoading();//图片加载完成关闭
          },
          fail: function (res) {
            that.setData({
              status: 1
            });
            wx.hideLoading();//图片加载完成关闭
          },
          complete: function () {
            //显示出加载中的提示
          }
        })
      }
    });
  },
  backTop:function(){
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
  },
  onPullDownRefresh: function () {
    var that = this;
    that.setData({
      itemList: [],
      page_index: 0,
      page_count: 1
    });
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
    that.itemList();
    wx.stopPullDownRefresh();//停止当前页面的下拉刷新
  },
  onReachBottom: function () {
    if (this.data.status == 1) {
      if (this.data.page_index < this.data.page_count) {
        this.itemList();
      }
    }
  },
  onPageScroll: function (e) {
    let res = wx.getSystemInfoSync();
    let wh = res.windowHeight;
    //大于两屏的高度则出现返回到顶部按钮
    if(e.scrollTop>2*wh){
      this.setData({
        back:false
      });
    }else{
      this.setData({
        back:true
      });
    }
  },
  onShareAppMessage: function () {

  }
})
