// pages/userPage/userPage.js
const app = getApp();
const common = require('../../common/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
      login_msg: 'unlogin',
      user_head: {},
      topic_parms: {
          page_index: 0,
          page_size: 10,
          page_count: 0,
          no_more: false,
          is_end: true,
          show_loading: false
      },
      topics: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      const that = this;
      const userid = options.userid;
      common.login(function (userInfo) {
          if (userInfo !== "unlogin") {
              let hd = {
                  'device-id': userInfo.openId,
                  'userid': userid,
                  'source-from': app.globalData.sourceFrom
              }
              that.setData({
                  login_msg: userInfo,
                  user_head: hd
              }, function () {
                  that.headInfo();
                  that.getTopics();
              })
         }else{
            let hd = {
              'userid': userid,
              'source-from': app.globalData.sourceFrom
            }
            that.setData({
              user_head: hd
            }, function () {
              that.headInfo();
              that.getTopics();
            })

         }
      });
  },
  // 获取用户信息
  headInfo () {
      wx.request({
          url: app.globalData.Host + '/user/my-circle/info',
          header: this.data.user_head,
          method: 'get',
          success: (res) => {
              if (res.data.status_code === 200) {
                  this.setData({
                      headInfo: res.data.my_circle_info
                  });
              }
          }
      });
  },
  // 获取发帖信息
  getTopics() {
    const that = this;
    const user_head = that.data.user_head;
    let tp = that.data.topic_parms;
    if (!tp.no_more && tp.is_end) {
        tp.is_end = false;
        tp.show_loading = true;
        that.setData({
            topic_parms: tp
        })
        wx.request({
            url: `${app.globalData.Host}/user/history-notes`,
            data: {
                page_index: tp.page_index,
                page_size: tp.page_size
            },
            header: user_head,
            method: 'POST',
            success: function (res) {
                let data = res.data.records;
                tp.page_index += 1;
                tp.page_count += data.length;
                tp.is_end = true;
                tp.show_loading = false;

                let topics = that.data.topics;
                topics.push(...data);

                if (tp.page_count === res.data.total_records) {
                    tp.no_more = true;
                }
                that.setData({
                    topic_parms: tp,
                    topics
                })
            }
        })
    }
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
      this.getTopics();
  }
})