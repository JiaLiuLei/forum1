var common = require('../../common/common.js');
var md5 = require('../../utils/md5.js');
var app = getApp();
Page({
  data: {
    currentTab:0,
    isSpread:false,
    userInfo:[],
    myPost:[],
    likes:[],
    comment:[],
    concern:[],
    collect:[],
    isFixed:false
  },
  onLoad: function (options) {
    var that = this;
    that.link='';
    that.postPage = 0;
    that.likesPage = 0;
    that.commentPage = 0;
    that.concernPage = 1;
    that.collectPage = 0;
    common.login(function(userInfo){
      if(userInfo !== "unlogin"){
        that.setData({
          userInfo: userInfo
        })
        that.headInfo();
        that.unread();
        if(that.data.currentTab == 0){
          that.myPost();
        }else if(that.data.currentTab == 1){
          that.likesData();
        }else if(that.data.currentTab == 2){
          that.commentData();
        }else if(that.data.currentTab == 3){
          that.concernData();
        }else if(that.data.currentTab == 4){
          that.collectData();
        }
      }
    });
    var query = wx.createSelectorQuery().in(this)
    query.select('#PostTypeNav').boundingClientRect(function(res){
      that.setData({
        TypeNav:res.top
      })
    }).exec()
  },
  onShow:function(){
    var that = this;
    if (wx.getStorageSync('isFt')) {
      common.login(function (userInfo) {
        if (userInfo !== "unlogin") {
          that.setData({
            myPost: []
          })
          that.myPost();
        }
      });
      wx.removeStorageSync('isFt');
    }
  },
  onHide:function(){
    this.setData({
      isSpread:false
    })
  },
  unread(){//未读消息
    var that = this;
    wx.request({
      url: app.globalData.Host + '/message/interact/unread',
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      data:{
        entity_type:13
      },
      method: 'POST',
      success: function (res) {
        console.log(res.data)
        that.setData({
          unread:res.data
        })
      },
      fail: function (res) {},
      complete: function (res) {},
    });
  },
  swichNav(e){
    var that = this;
    let index = e.currentTarget.dataset.current
    that.setData({
        currentTab:index
    });
    common.login(function(userInfo){
      if(userInfo !== "unlogin"){
        if(that.data.myPost.length==0&&index==0){
          that.myPost();
        }else if(that.data.likes.length==0&&index==1){
          that.likesData();
        }else if(that.data.comment.length==0&&index==2){
          that.commentData();
        }else if(that.data.concern.length==0&&index==3){
          that.concernData();
        }else if(that.data.collect.length==0&&index==4){
          that.collectData();
        }
      }
    });
  },
  deletePost(e){//删除帖子
    var that = this;
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var type = e.currentTarget.dataset.type;
    wx.showActionSheet({
      itemList: ['编辑','删除'],
      success: function(res) {
        if(res.tapIndex==0){
          if(type=='video'){
            wx.navigateTo({
              url: '../video/video?tid='+id
            });
          }else{
            wx.navigateTo({
              url: '../message/message?tid='+id
            });
          }
        }else if(res.tapIndex==1){
          wx.request({
            url: app.globalData.Host + '/new-note/delete/'+id,
            header: {
              'device-id': that.data.userInfo.userinfo.openId,
              'userid': that.data.userInfo.third_user_id,
              'source-from': app.globalData.sourceFrom
            },
            method: 'get',
            success: function (res) {
              var myPost = that.data.myPost;
              if(res.data.status_code == 200){
                  myPost.splice(index,1)
                  that.setData({
                    myPost:myPost
                  })
              }
            },
            fail: function (res) {},
            complete: function (res) {},
          });
        }
      },
      fail: function(res) {
        console.log(res.errMsg)
      }
    })
  },
  deleteComment(e){//删除我的评论
    var that = this;
    console.log(e)
    var id = e.currentTarget.dataset.id;
    var cid = e.currentTarget.dataset.cid;
    var index = e.currentTarget.dataset.index;
    wx.showActionSheet({
      itemList: ['删除评论'],
      success: function(res) {
        if(res.tapIndex==0){
          wx.request({
            url: app.globalData.Host + '/comment/del',
            header: {
              'device-id': that.data.userInfo.userinfo.openId,
              'userid': that.data.userInfo.third_user_id,
              'source-from': app.globalData.sourceFrom
            },
            data: {
                entity_type:13,
                entity_id:cid,
                comment_id:id
            },
            method: 'POST',
            success: function (res) {
              var comment = that.data.comment;
              if(res.data.status_code == 200){
                  comment.splice(index,1)
                  that.setData({
                    comment:comment
                  })
              }
            },
            fail: function (res) {},
            complete: function (res) {},
          });
        }
      },
      fail: function(res) {
        console.log(res.errMsg)
      }
    })
  },
  cancelCollect(e){//取消收藏
    var that = this;
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    wx.showActionSheet({
      itemList: ['取消收藏'],
      success: function(res) {
        if(res.tapIndex==0){
          wx.request({
            url: app.globalData.Host + '/collect/cancel',
            header: {
              'device-id': that.data.userInfo.userinfo.openId,
              'userid': that.data.userInfo.third_user_id,
              'source-from': app.globalData.sourceFrom
            },
            data:{
              entity_id:id,
              entity_type:13
            },
            method: 'POST',
            success: function (res) {
              var collect = that.data.collect;
              if(res.data.status_code == 200){
                  collect.splice(index,1)
                  that.setData({
                    collect:collect
                  })
              }
            },
            fail: function (res) {},
            complete: function (res) {},
          });
        }
      },
      fail: function(res) {
        console.log(res.errMsg)
      }
    })
  },
  cancelConcern(e){//取消关注
    var that = this;
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    wx.showActionSheet({
      itemList: ['取消关注'],
      success: function(res) {
        if(res.tapIndex==0){
          wx.request({
            url: app.globalData.Host + '/subscribe/attention/cancel',
            header: {
              'device-id': that.data.userInfo.userinfo.openId,
              'userid': that.data.userInfo.third_user_id,
              'source-from': app.globalData.sourceFrom
            },
            data:{
              attention_id:id,
              type: 0
            },
            method: 'POST',
            success: function (res) {
              var concern = that.data.concern;
              if(res.data.status_code == 200){
                  concern.splice(index,1)
                  that.setData({
                    concern:concern
                  })
              }
            },
            fail: function (res) {},
            complete: function (res) {},
          });
        }
      },
      fail: function(res) {
        console.log(res.errMsg)
      }
    })
  },
  getUserInfo(e){//获取个人信息
    var that = this;
    common.login(function(userInfo){
      if (userInfo !== "unlogin") {
        that.setData({
          userInfo:userInfo
        })
        that.headInfo();
        that.unread();
        if(that.data.myPost.length==0&&that.data.currentTab == 0){
          that.myPost();
        }else if(that.data.likes.length==0&&that.data.currentTab == 1){
          that.likesData();
        }else if(that.data.concern.length==0&&that.data.currentTab == 2){
          that.concernData();
        }else if(that.data.collect.length==0&&that.data.currentTab == 3){
          that.collectData();
        }
      }
    });
  },
  switchMenu(e){//发帖菜单
    this.setData({
      isSpread:!this.data.isSpread
    })
    common.collectData(app.globalData.userInfo, e.detail.formId, function () { })

  },
  bindReply(e){//回复
    wx.setStorage({
      key:"key",
      data:"value"
    })
  },
  headInfo(){//个人中心头信息
    var that = this;
    wx.request({
      url: app.globalData.Host + '/user/my-circle/info',
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      method: 'get',
      success: function (res) {
        if(res.data.status_code == 200){
          that.setData({
            headInfo:res.data.my_circle_info
          });
        }
      },
      fail: function (res) { },
      complete: function (res) {},
    });
  },
  sendPost:function(e){
    var that = this;
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
  myPost(){//我的发帖
    var that = this;
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.Host + '/user/history-notes',
      data: {
        page_index: that.postPage,
        page_size: 10
      },
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      method: 'post',
      success: function (res) {
        const obj = {};
        let j = 0;
        var myPost = that.data.myPost;
        var data = res.data.records;
        for (let i = myPost.length; i < (myPost.length + data.length); i++) {
          obj[`myPost[${i}]`] = data[j];
          j++;
        }
        that.setData(obj)
      },
      fail: function (res) { },
      complete: function (res) {wx.hideNavigationBarLoading()},
    });
  },
  likesData(){//我的消息
    var that = this;
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.Host + '/message/interact/list',
      data: {
        entity_type:13,
        read_status:'',
        message_type:'',
        page_index: that.likesPage,
        page_size: 10
      },
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      method: 'post',
      success: function (res) {
        if(res.data.status == "success"){
          const obj = {};
          let j = 0;
          var likes = that.data.likes;
          var data = res.data.records;
          if(data){
            for (let i = likes.length; i < (likes.length + data.length); i++) {
              obj[`likes[${i}]`] = data[j];
              j++;
            }
            that.setData(obj)
          }
        }
        if(that.likesPage == 0){
          that.unread();
        }
      },
      fail: function (res) { },
      complete: function (res) {wx.hideNavigationBarLoading()},
    });
  },
  commentData(){//我的评论
    var that = this;
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.Host + '/user/history-note-comments',
      data: {
        page_index: that.commentPage,
        page_size: 10
      },
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      method: 'post',
      success: function (res) {
        console.log(res)
        if(res.data.status == "success"){
          const obj = {};
          let j = 0;
          var comment = that.data.comment;
          var data = res.data.records;
          if(data){
            for (let i = comment.length; i < (comment.length + data.length); i++) {
              obj[`comment[${i}]`] = data[j];
              j++;
            }
            that.setData(obj)
          }
        }
        if(that.commentPage == 0){
          that.unread();
        }
      },
      fail: function (res) { },
      complete: function (res) {wx.hideNavigationBarLoading()},
    });
  },
  concernData(){//我的关注
    var that = this;
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.HostM + '/zixunApi/get_my_attention_info',
      data: {
        type:0,
        detail:1,
        all_type:1,
        userId:that.data.userInfo.third_user_id,
        md5_userId: md5.hexMD5("qjzxtt" + that.data.userInfo.third_user_id),
        page: that.concernPage,
        size:10,
        app_id:814
      },
      method: 'get',
      success: function (res) {
        console.log(res)
        if(res.statusCode == 200){
          for(var i in res.data){
            that.data.concern.push(res.data[i]);
          }
          that.setData({
            concern:that.data.concern
          })
        }
      },
      fail: function (res) { },
      complete: function (res) {wx.hideNavigationBarLoading()},
    });
  },
  collectData(){//我的收藏
    var that = this;
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.Host + '/user/collect-notes',
      data: {
        page_index: that.collectPage,
        page_size: 10
      },
      header: {
        'device-id': that.data.userInfo.userinfo.openId,
        'userid': that.data.userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      method: 'post',
      success: function (res) {
        console.log(res)
        if(res.data.status == "success"){
          const obj = {};
          let j = 0;
          var collect = that.data.collect;
          var data = res.data.records;
          if(data){
            for (let i = collect.length; i < (collect.length + data.length); i++) {
              obj[`collect[${i}]`] = data[j];
              j++;
            }
            that.setData(obj)
          }
        }
        
      },
      fail: function (res) { },
      complete: function (res) {wx.hideNavigationBarLoading()},
    });
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
  onReachBottom: function () {
    if(this.data.currentTab == 0){
      this.postPage++;
      this.myPost();
    }else if(this.data.currentTab == 1){
      this.likesPage++;
      this.likesData()
    }else if(this.data.currentTab == 2){
      this.commentPage++;
      this.commentData()
    }else if(this.data.currentTab == 3){
      this.concernPage++;
      this.concernData()
    }else if(this.data.currentTab == 4){
      this.collectPage++;
      this.collectData()
    }
  },
  onPullDownRefresh:function(){
    if(this.data.headInfo){
      this.headInfo();
      this.unread();
      if(this.data.currentTab == 0){
        this.postPage = 0;
        this.setData({
          myPost: []
        });
        this.myPost();
      }else if(this.data.currentTab == 1){
        this.likesPage = 0;
        this.setData({
          likes: []
        });
        this.likesData()
      }else if(this.data.currentTab == 2){
        this.commentPage = 0;
        this.setData({
          comment: []
        });
        this.commentData()
      }else if(this.data.currentTab == 3){
        this.concernPage = 1;
        this.setData({
          concern: []
        });
        this.concernData()
      }else if(this.data.currentTab == 4){
        this.collectPage = 0;
        this.setData({
          collect: []
        });
        this.collectData()
      }
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      wx.stopPullDownRefresh();//停止当前页面的下拉刷新
    }
  }
})