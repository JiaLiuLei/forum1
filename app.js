App({
  onLaunch: function (options) {
    // 来源判断
    const scene = options.scene;
    if (scene === 1036) { // APP
        this.globalData.showOpenApp = true;
    }
  },
  globalData: {
    userInfo: null,
    systemInfo: null,
    Host: 'https://zxtt.jia.com',
    // Host:'http://api-zxtt.zxtt.qa.qeeka.com',
    HostM:'https://m.jia.com',
    // Hostweixin:'http://wx.dev.jia.com',
    Hostweixin: 'https://weixin.jia.com',
    sourceFrom: 'wx_luntan_app',
    appParameter: '',
    showOpenApp: false
  }
})