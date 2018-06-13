//获取应用实例
const app = getApp();
const WxParse = require('../../wxParse/wxParse.js');
const common = require('../../common/common.js');
// const qiniuCommon = require("../../utils/qiniuCommon");
const Wxmlify = require('../../wxmlify/wxmlify.js')
const util = require('../../utils/util.js')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    msg: null,
    records: [],
    tem_record: [],
    recordsCount: 0,
    test_id: '195763',
    hot_list: [],
    noteId: '',
    ctd: {
      page_num: 0,
      page_size: 10,
      page_load_sum: 0,
      entity_type: 13,
      is_load: true,
      no_more: false,
      show_loading: false
    },
    like_end: true,
    attention_end: true,
    collect_end: true,
    login_msg: 'unlogin',
    user_head: {},
    commentUrl: '',
    zan: false,
    gz: false,
    sc: false,
    shareImg: '',
    appParameter: '',
    showOpenApp: false,
    share_title: "",
    imgSrcCode: "",
    temImg: "",
    temwidthheight:{},
    temCode: "",
    friendImage: "",
    videoImg:"",
    isPop: false,
    videoHidden:false,
    temFormId:"",
    codeUrl: "http://api-zxtt.zxtt.qa.qeeka.com",
    appParameter: 'zxtt://open/native?params={"url":"post_detail","data":{"id":"@note_id"}}'
  },

  /**
   * 生命周期函数--监听页面
   */
  onLoad: function (options) {
    wx.removeStorageSync('isComment');
    var that = this;
    let id = options.id;
    if (options.scene) {
      console.log(decodeURIComponent(options.scene))
      id = decodeURIComponent(options.scene).substring(3);
    }
    console.log(id)
    that.setData({
      noteId:id,// that.data.test_id,
      appParameter: `zxtt://open/native?params={"url":"post_detail","data":{"id":"${id}"}}`
    });
    common.login(function (userInfo) {
      // common.circleIcon(function (data) {
      //   that.setData({
      //     circleIcon: data
      //   })
      // }, userInfo);
      if (userInfo !== "unlogin") {
        let hd = {
          'device-id': userInfo.openId,
          'userid': userInfo.third_user_id,
          'source-from': app.globalData.sourceFrom
        }
        that.setData({
          login_msg: userInfo,
          user_head: hd
        })
      }
      that.getPageDetails();
    });
    wx.getSystemInfo({
      success: function (res) {
        if (res.model === 'iphonrx') {
          that.setData({
            isIphoneX: true
          })
        }
        let openApp = {
          parameter: that.data.appParameter,
          isIphoneX: that.data.isIphoneX
        }
        that.setData({
          openApp,
          showOpenApp: false //app.globalData.showOpenApp
        }, function () {

        })

      }
    })
  },
  onReady: function () {
    this.videoContext = wx.createVideoContext('myVideo')
  },
  loginClose: function (e) {
    this.setData({
      isLoginShow: false
    })
  },
  onShow: function () {
    const that = this;
    if (wx.getStorageSync('isComment')) {
      let ctd = that.data.ctd;
      ctd.is_load = true;
      ctd.no_more = false;
      ctd.page_num = 0;
      ctd.page_size = 10,
        ctd.page_load_sum = 11,
        that.setData({
          ctd
        })
    }

    that.getComments();

  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let that = this;
    let ctd = that.data.ctd;
    ctd.is_load = true;
    that.setData({
      ctd
    })
    this.getComments();

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let that = this;
    let title = this.data.share_title;
    if (title.length > 28) {
      title = title.substring(0, 26) + "……"
    }
    return {
      title: title,
      imageUrl: this.data.shareImg
    }
  },
  getUserInfo() {
    const that = this;
    let { commentUrl, zan, gz, sc, ctd } = this.data;
    common.login(function (userInfo) {
      if (userInfo !== 'unlogin') {
        let hd = {
          'device-id': userInfo.openId,
          'userid': userInfo.third_user_id,
          'source-from': app.globalData.sourceFrom
        }
        that.setData({
          login_msg: userInfo,
          user_head: hd
        })
        if (commentUrl) {
          wx.navigateTo({
            url: commentUrl
          });
        }
        if (zan) {
          ctd.page_num = 0;
          ctd.page_load_sum = 0;
          ctd.no_more = false;
          that.setData({
            ctd,
            records: []
          })
          wx.pageScrollTo({
            scrollTop: 0,
            duration: 0
          })
          that.getComments();
        }
        if (gz || sc) {
          that.getPageDetails();
        }
        common.collectData(app.globalData.userInfo,that.data.temFormId, function () {})
      }
      that.setData({
        isLoginShow: false
      });
    });
  },
  // copy内容到剪切板
  copy: function (event) {
    let text = event.currentTarget.dataset.url;
    wx.setClipboardData({
      data: text
    })
  },
  // 获取帖子详情
  getPageDetails() {
    // WxParse.wxParse('article', 'html', '', this, 5);
    const that = this;
    let { user_head, gz, sc, noteId, login_msg } = this.data;
    user_head = user_head.userid ? user_head:{ 'source-from': app.globalData.sourceFrom }
    wx.request({
      url: `${app.globalData.Host}/new-note/${noteId}`,
      header: user_head,
      success: (res) => {
        let content = res.data.note_new_item;
        content.create_time = content.create_time.replace("T", " ")
        let desc = content.content_list;
        if (desc) {
          let html = '';
          for (let i = 0, len = desc.length; i < len; i++) {
            if (1 === desc[i].type && desc[i].text) {
              let txt = desc[i].text+"<br>";
              html += txt;
            }
            if (2 === desc[i].type && desc[i].url) {
              html += `<img src="${desc[i].url}" />`;
            }
          }
          new Wxmlify(html, this, {
            dataKey: 'myRichText'
          })
          // WxParse.wxParse('article', 'html', html, this, 5);
        }
        this.setData({
          msg: content,
          share_title: content.share.share_title
        }, function () {
          that.setShareMsg(content, true);
        })
        if (gz && !content.has_attention) {
          this.attention();
        }
        if (sc && !content.has_collected) {
          this.collect();
        }
      }
    })
  },
  // 获取评论
  getComments() {
    let that = this;
    let d = that.data.ctd;
    let id = that.data.noteId;
    let user_head = that.data.user_head;
    if (d.is_load && !d.no_more) {
      d.is_load = false;
      d.show_loading = true;
      that.setData({
        ctd: d
      })
      wx.request({
        url: `${app.globalData.Host}/comment/new-list`,
        method: 'POST',
        header: user_head,
        data: {
          entity_id: id,
          entity_type: d.entity_type,
          page_index: d.page_num,
          page_size: d.page_size
        },
        success: (res) => {
          // 全部评论

          let data = res.data.records;
          d.page_num += 1;
          d.page_load_sum += data.length;
          d.is_load = true;
          d.show_loading = false;
          let records = []
          if (wx.getStorageSync('isComment')) {
            records = []
          } else {
            records = that.data.records;
          }

          records.push(...data);
          if (d.page_load_sum >= res.data.total_records) {
            d.no_more = true;
          } else {
            d.no_more = false;
          }
          console.log(records)
          //再这里进行处理，判断是否是回复过来的
          if (wx.getStorageSync('isComment')) {
            that.newTop(res.data.records);
            //进行页面定位
            wx.removeStorageSync('isComment');
          } else {
            that.setData({
              ctd: d,
              records,
              recordsCount: res.data.total_records
            })

          }
          // 热门评论
          if (res.data.hot_list) {
            that.setData({
              hot_list: res.data.hot_list
            })
          }
        }
      })
    }
  },
  // 删除评论
  deleteComments(event) {
    const { id, index, label, cid } = event.currentTarget.dataset;
    const user_head = this.data.user_head;
    wx.showModal({
      title: '提示',
      content: '是否删除此评论',
      success: (res) => {
        if (res.confirm) {
          let arr = [], key = 'records';
          if (label) {
            key = 'hot_list';
          }
          arr = this.data[key];
          arr.splice(index, 1);
          this.setData({
            [key]: arr
          })
          wx.request({
            url: `${app.globalData.Host}/comment/del`,
            method: 'POST',
            header: user_head,
            data: {
              entity_type: 13,
              entity_id: id,
              comment_id: cid
            },
            success: (msg) => {

            }
          })
        }
      }
    })
  },
  // 点赞
  like(event) {
    const that = this;
    const { login_msg, user_head, like_end } = that.data;
    if (login_msg !== 'unlogin') {
      if (like_end) {
        that.setData({
          like_end: false
        })
        let { index, label, id, etype } = event.currentTarget.dataset;
        let url = `${app.globalData.Host}/support`;
        if (Number(etype) === 6) { // 评论
          // 区分评论类型(热门，全部)
          let key = 'records';
          if (label) {
            key = 'hot_list';
          }
          let arr = that.data[key];
          // 设置值
          if (arr[index].has_supported) {
            arr[index].has_supported = false;
            arr[index].support_count -= 1;
            url = `${app.globalData.Host}/support/cancel`;
          } else {
            arr[index].has_supported = true;
            arr[index].support_count += 1;
          }
          // 赋值
          this.setData({
            [key]: arr
          })
        } else { // 帖子
          let arr = that.data.msg;
          if (arr.has_supported) {
            arr.has_supported = false;
            arr.support_count -= 1;
            url = `${app.globalData.Host}/support/cancel`;
          } else {
            arr.has_supported = true;
            arr.support_count += 1;
          }
          that.setData({
            msg: arr
          })
        }

        // 发起请求
        wx.request({
          url: url,
          method: 'POST',
          data: {
            entity_id: id,
            entity_type: etype,
          },
          header: user_head,
          success: (msg) => {
            that.setData({
              like_end: true
            })
            common.collectData(app.globalData.userInfo, event.detail.formId, function () { })
          }
        })
      }
    } else {
      that.setData({
        isLoginShow: true,
        zan: true,
        temFormId: event.detail.formId
      })
    }

  },
  // 跳转到评论页
  gotoComment(event) {
    const login_msg = this.data.login_msg;
    const { rtype, rname, id, cuid, cid, noteid } = event.currentTarget.dataset;

    const parms = `entity_type=${rtype}&entity_id=${id}&comment_user_id=${cuid}&comment_id=${cid}&reply_name=${rname}&noteid=${noteid}`;
    if (login_msg !== 'unlogin') {
      wx.navigateTo({
        url: `../postComments/postComments?${parms}`
      })
    } else {
      this.setData({
        isLoginShow: true,
        commentUrl: `../postComments/postComments?${parms}`
      })
    }
  },
  // 关注
  attention(e) {
    const that = this;
    let { msg, attention_end, login_msg, user_head } = that.data;
    if (login_msg !== 'unlogin') {
      if (attention_end) {
        that.setData({
          attention_end: false
        })
        let url = `${app.globalData.Host}/subscribe/attention`;
        if (msg.has_attention) {
          msg.has_attention = false;
          url = `${app.globalData.Host}/subscribe/attention/cancel`;
        } else {
          msg.has_attention = true;
        }
        that.setData({
          msg
        });

        // 发起请求
        wx.request({
          url: url,
          method: 'POST',
          data: {
            attention_id: msg.user_id,
            type: 0,
          },
          header: user_head,
          success: (msg) => {
            that.setData({
              attention_end: true
            })
            common.collectData(app.globalData.userInfo, e.detail.formId, function () { })
          }
        })
      }
    } else {
      that.setData({
        isLoginShow: true,
        gz: true,
        temFormId: e.detail.formId
      })
    }
  },
  // 收藏
  collect(e) {
    const that = this;
    let { msg, collect_end, login_msg, user_head } = that.data;
    if (login_msg !== 'unlogin') {
      if (collect_end) {
        that.setData({
          collect_end: false
        })
        let url = `${app.globalData.Host}/collect`;
        if (msg.has_collected) {
          msg.has_collected = false;
          url = `${app.globalData.Host}/collect/cancel`;
        } else {
          msg.has_collected = true;
        }
        that.setData({
          msg
        });

        // 发起请求
        wx.request({
          url: url,
          method: 'POST',
          data: {
            entity_id: msg.id,
            entity_type: 13,
          },
          header: user_head,
          success: (msg) => {
            that.setData({
              collect_end: true
            })
            common.collectData(app.globalData.userInfo, e.detail.formId, function () {})
          }
        })
      }
    } else {
      that.setData({
        isLoginShow: true,
        sc: true,
        temFormId: e.detail.formId
      })
    }
  },
  // 预览图片
  previewImage(event) {
    const { index, ctype, dtype } = event.currentTarget.dataset;
    const { records, hot_list } = this.data;
    let [urls, datas, imgs] = [[], [], []];
    if (dtype === 'hot_label') {
      datas = hot_list;
    } else {
      datas = records;
    }
    if (ctype === 'ftp') {
      imgs = datas[index].image_list;
    } else if (ctype === 'ttp') {
      imgs = datas[index].comment_image_list;
    }
    for (let i = 0; i < imgs.length; i++) {
      urls.push(imgs[i].url);
    }
    if (urls.length) {
      wx.previewImage({
        urls: urls
      })
    }
  },
  // 获取评论位置并滑动到该位置
  anchorPosition() {
    const that = this;
    const hot = that.data.hot_list;
    let tag = '#all-anchor';
    if (hot.length) {
      tag = '#hot-anchor';
    }
    const query = wx.createSelectorQuery();
    query.select(tag).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function (res) {
      let top = res[1].scrollTop + res[0].top;
      wx.pageScrollTo({
        scrollTop: top,
        duration: 0
      })
    })
  },
  // 生成分享图
  setShareMsg(msg, isShare) {
    const id = 'share-canvas';
    const friendId = 'friend-canvas';
    const firstText = `${msg.user_name}   ${msg.create_time}`;
    const secondText = `[${msg.community_master.title}]`;
    const thirdText = `${msg.title}`;
    let fourthText = '', a = 0;
    // const reg = /(<[\w\/]+>)|(&nbsp;)/g;
    const reg = /<(?!\/?IMG)[^<>]*>/ig;
    let ImgUrl = msg.share.share_img_url
    let shareType = "text";
    if (msg.video) {
      shareType = "video"
    } else if (msg.share.share_img_url){
      shareType = "img"
    }
    for (let i = 0; i < msg.content_list.length; i += 1) {
      if (msg.content_list[i].type === 1 && !a) {
        fourthText += msg.content_list[i].text.replace(reg, '').replace(/\s+/g, "").replace(/&amp;|&nbsp;/g,"");
        // a += 1;
      } else {
      }
    }
    let mainText = fourthText.replace("<br>", "").replace(/\s+/g, "");
    if (mainText.length>54){
      mainText = mainText.substring(0, 54) + "……"
    }
    this.setData({
      mainText: mainText
    });
    if (isShare) {
      this.generateImage(id, firstText, secondText, thirdText, fourthText, shareType, ImgUrl).then((shareImg) => {
        this.setData({
          shareImg
        });
      });
    } else {
      //异步加载分享图片
      this.friendsImg(friendId, thirdText, firstText, thirdText, fourthText, shareType, ImgUrl).then((friendImg) => {
        this.setData({
          friendImg
        });
      });
    }
  },
  //点击的时候再开始绘制图片
  newFriend() {

  },
  // 新回置顶
  newTop(currentRecord) {
    //如果是回复后话，对数据进行处理
    if (wx.getStorageSync('commentPerson')) {
      let that = this;
      let ctd = that.data.ctd;
      ctd.page_num = 1;
      ctd.page_load_sum = 10;
      ctd.no_more = false;
      ctd.is_load = false;
      let commentPerson = JSON.parse(wx.getStorageSync('commentPerson'));
      let records = currentRecord;
      let len = records.length;
      if (len < 10) {
        records = records.filter(function (currentValue, index, arr) {
          return currentValue.id != commentPerson.id;
        })
      }
      records.unshift(commentPerson)
      that.setData({
        ctd,
        records: records
      }, function () {
        that.pageScrollToBottom()
      })
    }

  },
  //有视频或者有图的视频绘制
  //图片预制
  generateImage: function (id, firstText, secondText, thirdText, fourthText, shareType, imgSrc) {
    let that = this;
    return new Promise((resolve, reject) => {
      // 第三段文字换行处理
      let t1 = thirdText.substring(0, 11);
      let t2 = '', t1c = 178;
      if (thirdText.length > 11) {
        let minNumber = Math.min(21, thirdText.length);
        t2 = thirdText.substring(11, minNumber);
        if (thirdText.length > 22) {
          t2 += '...';
        }
      } else {
        t1c = 200;
      }

      let textLen = fourthText.length;
      let textCount = textLen / 20;

      // 开始绘制
      const ctx = wx.createCanvasContext(id);

      //图片绘制，铺满白色背景
      ctx.setFillStyle("#fff")
      ctx.fillRect(0, 0, 420, 335)
      //创建新的图片对象
      ctx.setFontSize(20);
      ctx.setFillStyle('#999');
      ctx.fillText(firstText, 0, 25);
      if (shareType === "text" || shareType === "manyText") {
        if (textCount > 6) textCount = 6
        else if (textCount = 1) textCount = 1
        else textCount = 2
        for (let i = 0; i < textCount; i++) {
          let txt = fourthText.substring(0 + i * 20, 20 + i * 20)
          if (i + 1 === textCount) txt = txt.substring(0, 16) + "......"
          ctx.setFontSize(24);
          ctx.setFillStyle('#333');
          ctx.fillText(txt, 0, 100 + i * 36);
        }
        if (textCount <= 2) {
          let src1 = that.downImg("https://mued3.jia.com/applet/icon_bg_list.png");
          src1.then(function (res) {
            ctx.drawImage(res, 0, 0, 420, 335)
            that.ctxfun(ctx, id, resolve)
          })
        } else {
          that.ctxfun(ctx, id, resolve)
        }

      } else {
        //图片绘制，分为video好和img
        that.getCanvasImg(ctx, shareType, imgSrc, id, resolve, 0)
      }
    })
  },
  //分享到朋友圈图片绘制
  friendsImg(id, Title, secondText, thirdText, fourthText, shareType, imgSrc) {
    // 开始绘制
    let that = this;
    const ctx = wx.createCanvasContext(id);
    return new Promise((resolve, reject) => {
      //处理Title换行
      //图片绘制，铺满白色背景
      let previmgwidth =  that.data.previmgwidth > 416 ? 416 : that.data.previmgwidth 
      let previmgheight = that.data.previmgheight > 332 ? 332 : that.data.previmgheight
      let imgHeight = previmgheight;
      if (shareType === "img" || shareType === "video") {
        imgHeight = 0
      }else{
        imgHeight = previmgheight
      }
      let noticetxt1 = "齐家 | 装修论坛"
      let noticetxt2 = "长按扫码阅读"
      let conentCount = fourthText.length / 18
      let titleCount = Title.length / 15 
      conentCount > 3 ? conentCount = 3 : conentCount;
      ctx.setFillStyle("#fff")
      ctx.fillRect(0, 0, 480, 740 - imgHeight - conentCount*3)
      //文字绘制




      if (Title.length>24){
        Title = Title.substring(0, 26) + "……"
      }
      for (let i = 0; i < titleCount + 1; i++) {
        ctx.setFontSize(30);
        ctx.setFillStyle('#333');
        ctx.fillText(Title.substring(0 + i * 14, 14 + i * 14), 30, 60 + i * 40);
      }
      ctx.setFontSize(22);
      ctx.setFillStyle('#999');
      ctx.fillText(secondText, 30, 110 + titleCount*20);
      if (fourthText.length > 50) {
        fourthText = fourthText.substring(0, 51) + "……"
      }

      for (let i = 0; i < conentCount + 1; i++) {
        ctx.setFontSize(24);
        ctx.setFillStyle('#333');
        ctx.fillText(fourthText.substring(0 + i * 18, 18 + i * 18), 30, 150 + (i+1) * 30);
      }
      ctx.setFontSize(20);
      ctx.setFillStyle('#999');
      ctx.fillText(noticetxt1, 30, 550 + conentCount * 30 - imgHeight);
      ctx.setFontSize(20);
      ctx.setFillStyle('#333');
      ctx.fillText(noticetxt2, 30, 590 + conentCount * 30 - imgHeight);
      //图片调用
      //绘制二维码

      let codeUrl = that.getCode()
      codeUrl.then(function (res) {

        that.setData({
          temCode: res
        })
        ctx.drawImage(res, 320, 520 + conentCount * 30 - imgHeight, 116, 116)
        that.ctxfun(ctx, id, resolve)
      })
      //图片绘制
      if (shareType === "img" || shareType === "video") {
        ctx.drawImage(that.data.friendImage, 30 + (416 - previmgwidth)/2, 150 + (conentCount + 1) * 30, previmgwidth, previmgheight)
        if (shareType == "video") {
          ctx.drawImage(that.data.videoImg, 196, 150 + conentCount * 30 + previmgheight/2, 88, 88)
        }
        that.ctxfun(ctx, id, resolve)
      }
      else {
        that.ctxfun(ctx, id, resolve)
      }
    })
  },
  //
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
  ctxfun(ctx, id, resolve) {
    let that = this;
    ctx.draw(true, function () {
      wx.canvasToTempFilePath({
        canvasId: id,
        success: function (res) {
          const imgUrl = res.tempFilePath;
          that.setData({
            temImg: imgUrl
          })
          return resolve(imgUrl);
        }
      })
    });
  },
  openFriends() {
    //点击的时候，加载中
    let that = this;
    let content = this.data.msg
    that.setShareMsg(content, false);
    wx.showLoading({
      title: '加载中',
    })
    setTimeout(function () {
      that.setData({
        isPop: true,
        videoHidden: true
      })
      wx.hideLoading()
    }, 1000)


  },
  //单独图片或者video预览图片的绘制
  getCanvasImg(ctx, shareType, imgSrc, id, resolve, height) {
    //图片绘制，分为video好和img
    let that = this;

    let src = that.downImg(imgSrc.replace("http://", "https://"));
    src.then(function (res) {
      that.setData({
        friendImage:res
      },)
      ctx.drawImage(res, 0, 50 + height, 420, 335 + height)
    }).then(function () {
      if (shareType == "video") {
        let src2 = that.downImg('https://mued3.jia.com/applet/icon_play.png')
        src2.then(function (res) {
          that.setData({
            videoImg: res
          })
          ctx.drawImage(res, 166 + height, 153, 88, 88 + height)
          that.ctxfun(ctx, id, resolve)
        })
      } else {
        that.ctxfun(ctx, id, resolve)
      }

    })
  },
  saveImg() {
    let that = this;
    let temImg = that.data.temImg
    wx.saveImageToPhotosAlbum({
      filePath: temImg,
      success(res) {
        wx.showModal({
          title: '成功保存图片',
          content: '已成功为你保存图片到手机相册，请自行前往朋友圈分享',
          showCancel:false,
          confirmText:"知道了",
          success: function (res) {
            if (res.confirm) {
              that.setData({
                isPop: false
              })
            } else if (res.cancel) {
            }
          }
        })
      }
    })
  },
  getCode() {
    let that = this;
    return new Promise((resolve, reject) => {
      let noteid = that.data.noteId
      let codeImg = `${app.globalData.Host}/wx/generate/qr-code?scene=` + encodeURIComponent(`id=${noteid}`) + `&page=` + encodeURIComponent(`pages/postDetails/postDetails`)
      let codeUrl = that.downImg(codeImg)
      return resolve(codeUrl);
    })
  },
  //关闭弹窗
  closeFriend() {
    this.setData({
      isPop: false,
      videoHidden:false
    })

  },
  imageLoad(e){
    let _this = this;
    let $width = e.detail.width,    //获取图片真实宽度  
      $height = e.detail.height,
      ratio = $width / $height;   //图片的真实宽高比例  
    let viewHeight = 300,           //设置图片显示宽度，  
      viewWidth = 300 * ratio;    //计算的高度值     
    // viewWidth = viewWidth > 416 ? viewWidth:416
    _this.setData({
      previmgwidth: viewWidth,
      previmgheight: viewHeight
    })  
  }
})