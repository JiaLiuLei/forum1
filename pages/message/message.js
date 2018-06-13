// pages/message/message.js
const app = getApp();
const qiniuCommon = require("../../utils/qiniuCommon");
const common = require('../../common/common.js');
const md5 = require('../../utils/md5.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    circleArray: ['建材选购', '家居软装', '活动福利', '装修干货','装修日记','家人闲聊'],
    reverseArray:['家人闲聊', '装修日记', '装修干货', '活动福利','家居软装','建材选购'],
    sendtxt:'选择发布到一个圈子',
    fabu:true,
    imageList:[],
    isList:false,
    isFixed:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that=this;
      if(options.id){
          var channel=parseInt(options.id)-1;
          that.setData({
              sendtxt:that.data.circleArray[channel],
              index:channel,
              isList:true
          });
      }
      common.login(function(userInfo){
          that.setData({
            userInfo:userInfo
          });
          console.log(userInfo)
          //初始化七牛参数
          qiniuCommon.initQiniu(userInfo);
          //判断是我的页面-编辑过来
          if(options.tid){
              var noteId=options.tid;
              that.setData({
                noteId:noteId
              });
              that.editPostData(noteId);
          }
      });
  },
  editPostData:function(noteId){
      var that=this;
      wx.request({
          url: `${app.globalData.Host}/new-note/${noteId}`,
          header: {
              'device-id': that.data.userInfo.userinfo.openId,
              'userid': that.data.userInfo.third_user_id,
              'source-from': app.globalData.sourceFrom
          },
          success: (res) => {
              var noteData=res.data.note_new_item;
              var index=5-parseInt(noteData.community_master_id-1);
              var content_list=noteData.content_list;
              for(var i in content_list){
                  if(content_list[i].type==1){
                      if(i!=0){
                          that.data.imageList.push({
                              "type":1,
                              "text": content_list[i].text,
                              "textIcon":(!content_list[i].text)?true:false
                          });
                      }
                  }else{
                      var windowWidth = wx.getSystemInfoSync().windowWidth - (wx.getSystemInfoSync().windowWidth * 0.08);
                      if(content_list[i].width<400){
                          var radio = ((content_list[i].height / windowWidth) * 100 / 100).toFixed(2);
                      }else{
                          var radio = ((content_list[i].height / content_list[i].width) * 100 / 100).toFixed(2);
                      }
                      var relHeight = windowWidth * radio;
                      that.data.imageList.push({
                          "type":2,
                          "url": content_list[i].url,
                          "width":content_list[i].width,
                          "height":content_list[i].height,
                          "relHeight":relHeight
                      });

                  }
              }
              that.setData({
                  inputValue:noteData.title,
                  sendtxt:that.data.reverseArray[index],
                  index:index,
                  imageList:that.data.imageList,
                  zwTitle:noteData.content_list[0].text||'',
                  fabu:false
              });
          }
      });
  },
  bindPickerChange: function(e) {
        const index=e.detail.value;
        this.setData({
            index: index,
            sendtxt:this.data.reverseArray[index],
            fabu:false
        })
  },
  chooseImage: function (e) {
    var that = this;
    var countImg =that.data.imageList.length;
    var lastCount= 18-countImg;
    wx.chooseImage({
       sizeType: 'compressed',
       count: lastCount,
       success: function (res) {
          wx.showLoading({
            title: '上传中',
            mask: true
          });
          var tempFilePaths = res.tempFilePaths;
          for (let i = 0; i < tempFilePaths.length; i++) {
              var imgType = tempFilePaths[i].substr(tempFilePaths[i].lastIndexOf('.'));
               var key = qiniuCommon.randomWord(imgType);
               qiniuCommon.uploadQiniu(tempFilePaths[i], function (res) {
               var windowWidth = wx.getSystemInfoSync().windowWidth - (wx.getSystemInfoSync().windowWidth * 0.08);
               if(res.imageInfo.width<400){
                 var radio = ((res.imageInfo.height / windowWidth) * 100 / 100).toFixed(2);
               }else{
                 var radio = ((res.imageInfo.height / res.imageInfo.width) * 100 / 100).toFixed(2);
               }
               var relHeight = windowWidth * radio;
               that.data.imageList.push({
                   "type":2,
                   "url": res.imageURL,
                   "relHeight": relHeight,
                   "width":res.imageInfo.width,
                   "height":res.imageInfo.height
                });
                that.data.imageList.push({
                    "type":1,
                    "text": '',
                    "textIcon":false
                });
                that.setData({
                   imageList: that.data.imageList
                });
                  wx.hideLoading();
                }, function (error) {
                   wx.hideLoading();
                 },
                 {
                   region: 'ECN',
                   shouldUseQiniuFileName: false,
                   key: key
                  }, function (progress) {

                  }
                 );
                }
            },
            fail: function () {
                wx.hideLoading();
            },
            complete: function () {
                wx.hideLoading();
            }
        });
  },
  previewImage: function (e) {
        var current = e.target.dataset.src;
        var previewList = [];
        for (var i = 0; i < this.data.imageList.length; i++) {
            previewList[i] = this.data.imageList[i].url;
        }
        wx.previewImage({
            current: current,
            urls: previewList
        });
  },
  deleteImage: function (e) {
    var that=this;
    var currentId=e.currentTarget.dataset.index;
    if(that.data.imageList[currentId+1]&&that.data.imageList[currentId+1].text==""){
        var imageList1=that.data.imageList.splice(currentId,2);
    }else{
        var imageList1=that.data.imageList.splice(currentId,1);
    }
    that.setData({
      imageList: that.data.imageList
    });
  },
  textFocus:function(e){
    var that=this;
    var currentId=e.currentTarget.dataset.index;
    that.data.imageList[currentId].textIcon=true;
    that.setData({
      imageList: that.data.imageList
    });
  },
  areaInput:function(e){
      var that=this;
      var currentId=e.currentTarget.dataset.index;
      that.data.imageList[currentId].text= e.detail.value;
      that.setData({
          imageList: that.data.imageList
      });
  },
  textBlur:function(e){
    var that=this;
    var currentId=e.currentTarget.dataset.index;
    if(!e.detail.value){
        that.data.imageList[currentId].textIcon=false;
        that.setData({
            imageList: that.data.imageList
        });
    }
  },
  textInput: function(e){
        this.setData({
            inputValue: e.detail.value
        })
    },
  sendMessage :function(e){
    var that=this;
    var formData=e.detail.value;
    var imgArr=that.data.imageList;
    var content=[];
    for(var i=0;i<imgArr.length;i++){
        if(imgArr[i].type==2){
            content.push({
                "type":2,
                "url":imgArr[i].url,
                "width":imgArr[i].width,
                "height":imgArr[i].height
            });
        }else{
            if(imgArr[i].text!=""){
                content.push({
                    "type":1,
                    "text":imgArr[i].text
                });
            }
        }
    }
    if(formData.content!=""){
        content.unshift({
            "type":1,
            "text":formData.content
        });
    }
    //编辑更新帖子时改变index
    if(that.data.noteId||(!that.data.isList)){
        var data={
            title: formData.title,
            community_new_id:6-parseInt(that.data.index)
        }
    }else{
        var data={
            title: formData.title,
            community_new_id:parseInt(that.data.index)+1
        }
    }
    if(content[0]!=undefined){
      data.content=content;
    }
    //编辑更新帖子时多带id
     if(that.data.noteId){
         data.id=that.data.noteId;
     }
    if(formData.title==''){
        wx.showToast({
            title: '标题还没有填',
            icon: 'none',
            duration: 2000
        })
    }else if(formData.content==''){
        wx.showToast({
            title: '请输入正文',
            icon: 'none',
            duration: 2000
        })
    }else if(isNaN(that.data.index)){
        wx.showToast({
            title: '请选择圈子',
            icon: 'none',
            duration: 2000
        })
    }else{
        wx.showLoading({
            title: '提交中...'
        });
       wx.request({
            url: app.globalData.Host + '/new-note/create',
            data: data,
            header:{
                'device-id': that.data.userInfo.userinfo.openId,
                'userid': that.data.userInfo.third_user_id,
                'source-from': app.globalData.sourceFrom,
                'md5-userid': md5.hexMD5("qjzxtt@" + that.data.userInfo.third_user_id)
            },
            method: 'POST',
            dataType: 'json',
            success: function (res) {
                if (res.data.status_code==200) {
                    common.collectData(that.data.userInfo, e.detail.formId, function () {
                        wx.navigateBack({
                            delta: 1
                        });
                        if (!that.data.isList) {
                            wx.setStorageSync('isFt', true);
                        }
                        wx.hideLoading();
                    })
                }
            },
           fail:function(){
               wx.hideLoading();
           },
           complete:function(){
               wx.hideLoading();
           }
        });

    }
  }
})