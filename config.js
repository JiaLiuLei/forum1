var currentEnv = 'development';
var configInfo = {
  //common Config  
};

configInfo.development = {
  //development config
  //appApi: 'http://wap.zmzx.qa.qeeka.com'
  appApi: 'http://api-zxtt.zxtt.qa.qeeka.com/'
};

configInfo.product = {
  //product config
  appApi: 'https://zxtt.jia.com/'
};

module.exports.get = function (name) {
  if (configInfo[currentEnv][name]) {
    return configInfo[currentEnv][name];
  } else {
    if (configInfo[name]) {
      return configInfo[name];
    } else {
      throw new Error("Can't find config #" + name);
    }
  }
};