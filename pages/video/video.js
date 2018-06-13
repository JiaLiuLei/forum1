const app = getApp();
const qiniuCommon = require("../../utils/qiniuCommon");
const common = require('../../common/common.js');
const md5 = require('../../utils/md5.js');
Page({
    data: {
        devPos:'back',//前后摄像头参数
        isPress: false,//是否长按
        isCamra: false,//相机下面的div
        isBat: true,//是否取消和确认视频
        secondPage: true,//第二屏
        firstPage:false,//第一屏
        circleArray: ['建材选购', '家居软装', '活动福利', '装修干货','装修日记','家人闲聊'],//选择圈子参数
        reverseArray:['家人闲聊', '装修日记', '装修干货', '活动福利','家居软装','建材选购'],
        sendtxt:'选择发布到一个圈子',
        fabu:true,//是否已选择一个圈子
        count:0,//长按视频进度条
        isList:false,
        formEdit:false //是否是我的-编辑页面过来的
    },
    onLoad:function(options){
        var that=this;
        if(options.id){
            var channel=parseInt(options.id)-1;
            that.setData({
                sendtxt:that.data.circleArray[channel],
                index:channel,
                isList:true
            });
        }
        that.setData({
            ctx:  wx.createCameraContext()
        });
        if(wx.getStorageSync('camra')){
            wx.getSetting({
                success: function (res) {
                    if (!res.authSetting['scope.camera']) {
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: '摄像头功能需要授权才能正常使用噢！请点击“确定”-“摄像头”再次授权',
                            success: function (res) {
                                if (res.confirm) {
                                    wx.openSetting({
                                        success: function (res) {
                                            res.authSetting = {
                                                "scope.camera": true
                                            };
                                            wx.removeStorageSync('camra');
                                        }
                                    })
                                } else if (res.cancel) {

                                }
                            }
                        });
                    }
                }
            });
        }else{
            //获取登录信息
            common.login(function(userInfo){
                that.setData({
                    userInfo:userInfo
                });
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
        }
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
                that.setData({
                    inputValue:noteData.title,
                    textValue:content_list[0].text,
                    sendtxt:that.data.reverseArray[index],
                    index:index,
                    videoSrc:noteData.video.video_url,
                    cover:noteData.video.video_preview_url,
                    fabu:false,
                    isBat: true,
                    secondPage:false,
                    isCamra:true,
                    firstPage:true,
                    formEdit:true
                });
            }
        });
    },
    getVideoCover:function(url){
        //获取视频的封面图
        var that=this;
        wx.request({
            url: url.replace("http://","https://")+'?avinfo',
            success: function (res) {
                for(var i in res.data.streams){
                    if(res.data.streams[i].width&&res.data.streams[i].height){
                        var urlSuffix='?vframe/jpg/offset/0/w/'+res.data.streams[i].width+'/h/'+res.data.streams[i].height+'/rotate/auto';
                    }
                }
                var cover=url+urlSuffix;
                that.setData({
                    cover: cover
                });
            }
        });
    },
    startRecord:function(){
        var that=this;
        that.setData({
            cover: ''
        });
        that.isRecord();
        //开始录像
        that.data.ctx.startRecord({
            success: (res) => {
                that.countInterval();
                that.setData({
                    isPress: true
                });
            },
            fail: (res) => {
                wx.setStorageSync('record', true);
            }
        });
    },
    isRecord:function(){
        //是否授权过
        if(wx.getStorageSync('record')){
            wx.getSetting({
                success: function (res) {
                    if (!res.authSetting['scope.record']) {
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: '录音功能需要授权才能正常使用噢！请点击“确定”-“录音功能”再次授权',
                            success: function (res) {
                                if (res.confirm) {
                                    wx.openSetting({
                                        success: function (res) {
                                            res.authSetting = {
                                                "scope.record": true
                                            };
                                            wx.removeStorageSync('record');
                                        }
                                    })
                                } else if (res.cancel) {

                                }
                            }
                        });
                    }
                }
            });
        }
    },
    stopRecord:function(){
        //结束录像
        var that=this;
        clearInterval(that.data.countTimer);
        that.data.ctx.stopRecord({
            success: (res) => {
                if(that.data.count<30){
                    that.setData({
                        count:0,
                        isPress: false
                    });
                    clearInterval(that.data.countTimer);
                }else{
                    var videoPath=res.tempVideoPath;
                    var videoType=videoPath.substr(videoPath.lastIndexOf('.'));
                    var key = qiniuCommon.randomWord(videoType);
                    qiniuCommon.uploadQiniu(videoPath, function (res) {
                            that.setData({
                                videoSrc: res.imageURL
                            });
                            that.getVideoCover(res.imageURL);
                        }, function (error) {
                            console.error('error: ' + JSON.stringify(error));
                        },
                        {
                            region: 'ECN',
                            shouldUseQiniuFileName: false,
                            key: key
                        }, function (progress) {

                        }
                    );
                    that.setData({
                        isPress: false,
                        isCamra:true,
                        isBat:false
                    })
                }
            },
            fail: (res) => {
                that.setData({
                    count: 0,
                    isPress: false
                });
            },
            complete: (res) => {
                that.setData({
                    isPress: false
                });
            }
        });
    },
    confirmRecord:function(){
        //确认录像并且到第二屏
        this.setData({
            isBat: true,
            secondPage:false,
            isCamra:true,
            firstPage:true
        });
    },
    cancelRecord:function(){
        this.setData({
            isBat: true,
            isCamra:false,
            count:0
        });
    },
    changePos:function(){
        if(this.data.devPos=='back'){
            this.setData({
                devPos:'front'
            });
        }else{
            this.setData({
                devPos:'back'
            });
        }
    },
    vibrateLong:function(){
        wx.vibrateLong({
            success: function (res) {
            }
        })
    },
    backFirstPage:function(){
        if(this.data.cover){
            this.setData({
                isCamra:true,
                isBat:false,
                firstPage:false,
                secondPage:true
            });
        }else{
            this.setData({
                isCamra:false,
                count:0,
                firstPage:false,
                secondPage:true
            });
        }
    },
    chooseVideo:function(){
        var that = this;
        wx.chooseVideo({
            sourceType: ['album'],
            camera: 'back',
            success: function(res) {
                if(res.duration>=3){
                    var videoType=res.tempFilePath.substr(res.tempFilePath.lastIndexOf('.'));
                    var key = qiniuCommon.randomWord(videoType);
                    qiniuCommon.uploadQiniu(res.tempFilePath, function (res) {
                            that.setData({
                                videoSrc: res.imageURL
                            });
                            that.getVideoCover(res.imageURL);
                        }, function (error) {
                            console.error('error: ' + JSON.stringify(error));
                        },
                        {
                            region: 'ECN',
                            shouldUseQiniuFileName: false,
                            key: key
                        }, function (progress) {

                        }
                    );
                    that.setData({
                        secondPage:false,
                        firstPage:true,
                        cameraHeight:0
                    });
                }else if(res.duration>120){
                    wx.showToast({
                        title: '不支持上传长于2分钟的视频',
                        icon: 'none',
                        duration: 2000
                    })
                }else{
                    wx.showToast({
                        title: '不支持上传短于3秒内的视频',
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
        });
    },
    bindPickerChange: function(e) {
        const index=parseInt(e.detail.value);
        this.setData({
            index: index,
            sendtxt:this.data.reverseArray[index],
            fabu:false
        })
    },
    textInput: function(e){
        this.setData({
            inputValue: e.detail.value
        })
    },
    areaInput: function(e){
        this.setData({
            textValue: e.detail.value
        })
    },
    sendVideo :function(){
        var that=this;
        if(!that.data.inputValue){
            wx.showToast({
                title: '标题还没有填',
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
            var data={
                title: that.data.inputValue,
                content:[{
                    "type":1,
                    "text":that.data.textValue||''
                }],
                video:{
                    "video_url": that.data.videoSrc,
                    "video_preview_url": that.data.cover
                }
            }
            if(that.data.noteId||(!that.data.isList)){
                data.community_new_id=6-parseInt(that.data.index);
            }else{
                data.community_new_id=parseInt(that.data.index)+1;
            }
            //编辑更新帖子时多带id
            if(that.data.noteId){
                data.id=that.data.noteId;
            }
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
                        wx.navigateBack({
                            delta:1
                        });
                        if(!that.data.isList){
                            wx.setStorageSync('isFt', true);
                        }
                        wx.hideLoading();
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
    },
    countInterval: function () {
        // 设置倒计时 定时器 每100毫秒执行一次，计数器count+1 ,耗时6秒绘一圈
        var that=this;
        that.data.countTimer=setInterval(function(){
            if (that.data.count < 100) {
                that.data.count++;
                that.setData({
                    count:that.data.count
                });
            }else{
                that.stopRecord();
            }
        },100);
    },
    error:function(){
        wx.setStorageSync('camra', true);
    }
})