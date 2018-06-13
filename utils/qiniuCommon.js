const app = getApp();
const qiniuUploader = require("qiniuUploader");
var qiniuCommon = {
  initQiniu: function(userInfo,callback) {
    wx.request({
      url: app.globalData.Host + '/api/image/token',
      data: {
        'device-id': userInfo.userinfo.openId
      },
      header:{
        'device-id': userInfo.userinfo.openId,
        'userid': userInfo.third_user_id,
        'source-from': app.globalData.sourceFrom
      },
      success: function (res) {
        var options = {
          region: 'ECN',
          uptoken: res.data.uploadToken,
          domain: 'http://imgmall.tg.com.cn'
        };
        qiniuUploader.init(options);
        callback && callback();
      }
    });
  },
  uploadQiniu:function(path,success,fail,options, progress, cancelTask){
    qiniuUploader.upload(path, success, fail,options, progress, cancelTask);
  },
  randomWord: function(timgtype){
    var str,pos="";
    var date=new Date();
    var year = date.getFullYear();
    var month= date.getMonth() + 1 < 10 ? "0" + parseInt(date.getMonth() + 1) : parseInt(date.getMonth() + 1);
    var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    str="zxtt/"+year+"/"+month+"/"+day+"/"+hour+minute+"/";
    var arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for(var i=0; i<28; i++){
      pos = Math.round(Math.random() * (arr.length-1));
      str += arr[pos];
    }
    str+=timgtype;
    return str;
  }
}
module.exports = qiniuCommon;