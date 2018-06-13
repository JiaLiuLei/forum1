var common = require('../../common/common.js');
var app = getApp();
Page({
  data: {
    currentTab: 0,
    scrollTop: 0,
    postNewest: [],
    postEssence: [],
    isSpread: false,
    shareImg:'',
    testId:1
  },
  onLoad: function (options) {
    var that = this;
    that.onepage = 0;
    that.twopage = 0;
    that.link = '';
    var id = options.id;
    if (options.scene) {
      id = decodeURIComponent(options.scene).substring(3);
    }
    that.setData({
      circleId: id
    })
    var query = wx.createSelectorQuery().in(this)
    query.select('#PostTypeNav').boundingClientRect(function (res) {
      that.setData({
        TypeNav: res.top
      })
    }).exec();
    common.login(function (userInfo) {
      that.setData({
        userInfo: userInfo
      });
      that.circleDetail();
      that.LatestPosts();
      that.Recommend();
    });
  },
  onShow: function () {
    var that = this;
    if (wx.getStorageSync('isFt')) {
      common.login(function (userInfo) {
        that.setData({
          postNewest: []
        });
        that.LatestPosts();
      });
      wx.removeStorageSync('isFt');
    }
  },
  sendPost: function (e) {//发帖跳转
    var that = this;
    that.link = e.currentTarget.dataset.link + '?id=' + that.data.circleId;
    common.login(function (userInfo) {
      if (userInfo == "unlogin") {
        that.setData({
          isLoginShow: true
        })
      } else {
        wx.navigateTo({
          url: that.link
        });
      }
    });
  },
  swichNav(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.current
    });
  },
  loginClose: function (e) {
    this.setData({
      isLoginShow: false
    })
  },
  getUserInfo: function () {
    var that = this;
    common.login(function (userInfo) {
      that.setData({
        isLoginShow: false
      });
      if (userInfo !== "unlogin") {
        wx.navigateTo({
          url: that.link
        });
      }
    });
  },
  circleDetail() {//圈子详情
    var that = this;
    wx.request({
      url: app.globalData.Host + '/community-new/detail',
      data: {
        id: that.data.circleId
      },
      method: 'GET',
      success: function (res) {
        //获取完信息开始绘制图片
        that.setData({
          circle: res.data
        },function(){
          let circleId = that.data.circleId;
          //通过circleId拼接不同的图片
          let imgUrl = `https://mued3.jia.com/applet/circle-bg-${circleId}.png` 
          let circle = that.data.circle
          let firstText = `浏览 ${that.floatNum(circle.browse_count)}  帖子 ${that.floatNum(circle.note_count)}  讨论 ${that.floatNum(circle.comment_count)}`
          that.generateImage(firstText, imgUrl).then((shareImg) => {
            that.setData({
              shareImg: shareImg
            });
          });
        })

        wx.setNavigationBarTitle({
          title: res.data.title
        })
      },
      fail: function (res) { },
      complete: function (res) { },
    });
  },
  LatestPosts() {//最新帖子
    var that = this;
    var header = {
      'source-from': app.globalData.sourceFrom
    }
    if (that.data.userInfo.userinfo) {
      header['device-id'] = that.data.userInfo.userinfo.openId;
      header['userid'] = that.data.userInfo.third_user_id;
    }
    wx.request({
      url: app.globalData.Host + '/new-note/search/by/community',
      data: {
        page_index: that.onepage,
        page_size: 10,
        community_new_id: that.data.circleId
      },
      header: header,
      method: 'post',
      success: function (res) {
        const obj = {}
        let a = 0;
        var postNewest = that.data.postNewest;
        var datas = res.data.records;
        for (let i = postNewest.length; i < (postNewest.length + datas.length); i++) {
          obj[`postNewest[${i}]`] = datas[a];
          a++;
        }
        that.setData(obj)
      },
      fail: function (res) { },
      complete: function (res) { },
    });
  },
  Recommend() {//精华帖
    var that = this;
    wx.showNavigationBarLoading();
    var header = {
      'source-from': app.globalData.sourceFrom
    }
    if (that.data.userInfo.userinfo) {
      header['device-id'] = that.data.userInfo.userinfo.openId;
      header['userid'] = that.data.userInfo.third_user_id;
    }
    wx.request({
      url: app.globalData.Host + '/new-note/search/by/community/recommend',
      data: {
        page_index: that.twopage,
        page_size: 10,
        community_new_id: that.data.circleId
      },
      header: header,
      method: 'post',
      success: function (res) {
        const obj = {};
        let j = 0;
        var postEssence = that.data.postEssence;
        var data = res.data.records;
        for (let i = postEssence.length; i < (postEssence.length + data.length); i++) {
          obj[`postEssence[${i}]`] = data[j];
          j++;
        }
        that.setData(obj)
      },
      fail: function (res) { },
      complete: function (res) { wx.hideNavigationBarLoading() },
    });
  },
  onHide: function () {
    this.setData({
      isSpread: false
    })
  },
  switchMenu: function () {//发帖按钮展开
    this.setData({
      isSpread: !this.data.isSpread
    })
  },
  onPageScroll: function (e) {
    if(e.scrollTop>=this.data.TypeNav && !this.data.isFixed){
      this.setData({
        isFixed:true
      })
    }else if(e.scrollTop<this.data.TypeNav && this.data.isFixed){
      this.setData({
        isFixed:false
      })
    }
  },
  onReachBottom: function () {//页面上拉触底事件的处理函数
    if (this.data.currentTab == 0) {
      this.onepage++;
      this.LatestPosts()
    } else if (this.data.currentTab == 1) {
      this.twopage++;
      this.Recommend()
    }
  },
  onShareAppMessage: function () {
    return {
      title: this.data.circle.title,
      imageUrl: this.data.shareImg,
      path: '/pages/PostType/PostType?id=' + this.data.circleId,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  onPullDownRefresh: function () {//下拉刷新
    if (this.data.currentTab == 0) {
      this.onepage = 0;
      this.setData({
        postNewest: []
      });
      this.LatestPosts()
    } else if (this.data.currentTab == 1) {
      this.twopage = 0;
      this.setData({
        postEssence: []
      });
      this.Recommend()
    }
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
    wx.stopPullDownRefresh();//停止当前页面的下拉刷新
  },
  // 生成分享图
  generateImage: function (firstText,imgSrc) {
    let that = this;
    return new Promise((resolve, reject) => {
      // 开始绘制
      let id ="share-canvas"
      const ctx = wx.createCanvasContext(id);
      //图片绘制，铺满白色背景
      ctx.setFillStyle("#fff")
      ctx.fillRect(0, 0, 420, 335)
      //第一行文字
      ctx.setFontSize(20);
      ctx.setFillStyle('#999');
      ctx.fillText(firstText, 0, 25);
      //图片
      let src = that.downImg(imgSrc.replace("http://", "https://"));
      src.then(function (res) {
        ctx.drawImage(res, 0, 0, 420, 335)
      }).then(function () {
        ctx.draw(true, function () {
          wx.canvasToTempFilePath({
            canvasId: id,
            success: function (res) {
              const imgUrl = res.tempFilePath;
              return resolve(imgUrl);
            }
          })
        });
      })

    })
  },
  downImg(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url, //仅为示例，并非真实的资源
        success: function (res) {
          // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内
          if (res.statusCode === 200) {
            return resolve(res.tempFilePath);
          }
        }
      })

    })

  },
  //数字格式化
  floatNum(num){
    if(num>9999){
      return parseFloat(num / 10000).toFixed(2) + "w"
    }
    else{
      return num;
    }

  }
})