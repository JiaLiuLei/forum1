const app = getApp();
const qiniuCommon = require("../../utils/qiniuCommon");
const common = require('../../common/common.js');
Page({
  data: {
    image_list: [],
    content: '',
    postClass: '',
    options: null,
    phText: '回复',
    user_head: {}
  },
  onLoad: function (options) {
    const that = this;
    let op = options;
    if (op.reply_name && op.reply_name !== 'undefined') {
      op.reply_name = `回复 ${op.reply_name}:`;
    } else {
      op.reply_name = '回复';
    }
    that.setData({
      options: op
    })

    common.login(function (userInfo) {
      let hd = {
        'device-id': userInfo.openId,
        'userid': userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      }
      that.setData({
        user_head: hd
      })
      qiniuCommon.initQiniu(userInfo);
    })
  },
  // 获取用户图片
  getImg() {
    const that = this;
    let image_list = that.data.image_list;
    wx.chooseImage({
      success: (res) => {
        const imgs = res.tempFilePaths;

        for (let i = 0; i < imgs.length; i++) {
          const imgType = imgs[i].substr(imgs[i].lastIndexOf('.'));
          const key = qiniuCommon.randomWord(imgType);
          qiniuCommon.uploadQiniu(imgs[i], (imgItem) => {
            let b = { url: imgItem.imageURL };
            image_list.push(b);
            that.setData({
              image_list
            })
          }, (error) => {
            console.error('error: ' + JSON.stringify(error));
          }, {
              region: 'ECN',
              shouldUseQiniuFileName: false,
              key
            }, (progress) => {

            });
        }
      }
    })
  },
  // 删除图片
  deleteImg(event) {
    let image_list = this.data.image_list;
    const img = event.currentTarget.dataset.img;
    const index = image_list.indexOf(img);
    image_list.splice(index, 1);
    this.setData({
      image_list
    })
  },
  // 获取用户输入内容
  getText(event) {
    let content = event.detail.value;
    content = content.trim();
    let postClass = '';
    if (content.length) {
      postClass = 'on';
    }
    this.setData({
      postClass,
      content,
    })
  },
  // 发送内容
  postMsg(e) {
    const that = this;
    let { entity_type, entity_id, comment_user_id, comment_id } = that.data.options;
    const { content, image_list, user_head } = that.data;
    let parms = {
      entity_type,
      entity_id,
      content,
      image_list,
    }
    if (comment_user_id !== 'undefined') {
      parms.comment_user_id = comment_user_id;
    }
    if (comment_id !== 'undefined') {
      parms.comment_id = comment_id;
    }
    if (content) {
      that.setData({
        postClass: ''
      })
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      // 发起请求
      wx.request({
        url: app.globalData.Host + '/comment/add',
        method: 'POST',
        data: parms,
        header: user_head,
        success: (msg) => {
          that.setData({
            postClass: 'on'
          })
          wx.hideLoading();
          wx.setStorageSync('isComment', true);
          console.log(msg)
          msg.data.floor = 0;
          wx.setStorageSync('commentPerson', JSON.stringify(msg.data));
          if (msg.statusCode === 200) {

            wx.showToast({
              title: "发送成功",
              icon: 'none',
              duration: 1000
            })
            common.collectData(app.globalData.userInfo, e.detail.formId, function () {
                setTimeout(function () {
                    wx.navigateBack({
                        delta: 1
                    })
                }, 1000)  
            })
          }else{
            wx.showToast({
              title: "发送失败",
              icon: 'none',
              duration: 1000
            })
          }
        }
      })
    }
  }
})