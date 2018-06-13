var app = getApp();
function login(cb) {//登录
  var that = this;
  if (app.globalData.userInfo) {
    typeof cb == "function" && cb(app.globalData.userInfo)
  }else{
    wx.login({
      success: res => {
        var code = res.code;
        wx.getSetting({
          success: (re) => {
            if (re.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
              wx.getUserInfo({
                success: function (info) {
                  var rawData = info['rawData'];
                  var signature = info['signature'];
                  var encryptData = info['encryptData'];
                  var encryptedData = info['encryptedData'];
                  var iv = info['iv'];
                  wx.request({
                    url: app.globalData.Hostweixin+'/index.php/api/routine/wxlogin',
                    method: 'post',
                    data: {
                      "code": code,
                      "from_app": "forum",
                      "rawData": rawData,
                      "signature": signature,
                      "encryptData": encryptData,
                      'iv': iv,
                      'encryptedData': encryptedData
                    },
                    success: function (res) {
                      app.globalData.userInfo = res.data
                      console.log(res.data)
                      typeof cb == 'function' && cb(app.globalData.userInfo);
                    },
                    fail(res) {
                      console.log(res,"登录失败");
                    }
                  });
                },
                fail(res) {
                }
              })
            }else{
             typeof cb == 'function' && cb('unlogin');
            }
          }
        });
      }
    })
  }
};
function circleIcon(cb){
  var that = this;
  that.login(function(userInfo){
    var header={
      'source-from': app.globalData.sourceFrom
    }
    if(userInfo.userinfo){
      header['device-id']=userInfo.userinfo.openId;
      header['userid']=userInfo.third_user_id;
    }
    console.log(header)
    wx.request({
      url: app.globalData.Host + '/community-new/icon',
      header:header,
      method: 'GET',
      success: function (res) {     
        typeof cb == 'function' && cb(res.data.community_icon_list);
      },
      fail: function (res) { },
      complete: function (res) {}
    });
  })
}

/**
 * 生成分享图
 *
 * @param {string} id canvasId
 * @param {string} firstText 第一段文本
 * @param {string} secondText 第二段文本
 * @param {string} thirdText 第三段文本
 * @param {string} fourthText 第四段文本
 * @return {Promise} img 生成的图片路径
 */
function generateImage(id, firstText, secondText, thirdText, fourthText) {
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

        // 第四段文字换行处理
        let f1 = fourthText.substring(0, 15);
        let f2 = '', f1c = 258;
        if (fourthText.length > 15) {
            let minNumber = Math.min(29, fourthText.length);
            f2 = fourthText.substring(15, minNumber);
            if (fourthText.length > 30) {
                f2 += '...';
            }
        } else {
            f1c = 270;
        }

        // 开始绘制
        const ctx = wx.createCanvasContext(id);

        ctx.setFontSize(20);
        ctx.setFillStyle('#999');
        ctx.fillText(firstText, 0, 25);

        ctx.setFillStyle('#dbe7f3');
        ctx.fillRect(0, 48, 420, 280);

        ctx.setFillStyle('#fff');
        ctx.fillRect(22, 74, 373, 229);

        ctx.setFontSize(22);
        ctx.setFillStyle('#999');
        ctx.fillText(secondText, 45, 125);

        ctx.setFontSize(29);
        ctx.setFillStyle('#333');
        ctx.fillText(t1, 43, t1c);

        ctx.setFontSize(29);
        ctx.setFillStyle('#333');
        ctx.fillText(t2, 43, 214);

        ctx.setFontSize(22);
        ctx.setFillStyle('#999');
        ctx.fillText(f1, 45, f1c);

        ctx.setFontSize(22);
        ctx.setFillStyle('#999');
        ctx.fillText(f2, 45, 290);

        ctx.draw(true, function () {
            wx.canvasToTempFilePath({
                canvasId: id,
                success: function (res) {
                    const img = res.tempFilePath;
                    return resolve(img);
                }
            })
        });
    })
}
// 收集数据
function collectData(userInfo, formId, callback){
  let that = this;
  let count = 0;
  if (userInfo){
      //收集openid
      wx.request({
          url: app.globalData.Host + '/wx/collect/openid',
          method: 'POST',
          data: {
              user_id: userInfo.third_user_id,
              user_name: userInfo.userinfo.nickname,
              open_id: userInfo.userinfo.openId
          },
          success: function (res) {
              count = count + 1;
              if (count === 2) callback()
          }
      })
      //收集formid
      wx.request({
          url: app.globalData.Host + '/wx/collect/user-form ',
          method: 'POST',
          data: {
              form_id: formId,
              user_id: userInfo.third_user_id
          },
          success: function (res) {
              count = count + 1;
              if (count === 2) callback()
          }
      })
  }

}


module.exports = {
    login: login,
    circleIcon:circleIcon,
    generateImage,
    collectData
}