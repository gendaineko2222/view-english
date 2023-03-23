window.tab = {
  new: function (title = '新しいタブ') {
    const newTabID = `tab-${UUID.generate()}`;
    const newTabDOM = document.createElement('iframe');
    newTabDOM.src = 'file/file.html';
    newTabDOM.id = newTabID + '-iframe';
    document.getElementById('mainContent').appendChild(newTabDOM);
    const tabDom = document.createElement('div');
    tabDom.id = newTabID + '-tab';
    tabDom.classList.add('tab');
    tabDom.innerHTML = `
      <button class="celect-view-tab-button reset" id="showTab${newTabID}" onclick='tab.view("${newTabID}")'>${title}</button>
      <button class="tab-close-button reset text-icon close-icon" onclick='tab.close("${newTabID}")'>×</button>
    `;
    document.getElementById('tabs').appendChild(tabDom);
    this.tabInfo.tabs.push({
      tabID: newTabID,
      title: title,
      viewed: true,
    });
    this.view(newTabID);
    return newTabID;
  },
  close: function (tabID = tab.openedTab()) {
    //DOMから消去する
    document.getElementById(tabID + '-iframe').remove();
    document.getElementById(tabID + '-tab').remove();
    //タブを閉じたら、閉じたタブの前のタブを開く
    const tabIDArray = tab.tabInfo.tabs.map((tab) => tab.tabID);
    tab.tabInfo.tabs = tab.tabInfo.tabs.filter((tab) => tab.tabID !== tabID);
    console.debug(tabIDArray);
    if (tabIDArray.length <= 1) {
      //タブがなくなったら、新しいタブを開く
      tab.new();
    } else {
      //閉じたタブの前のタブを開く
      tab.view(tabIDArray[tabIDArray.indexOf(tabID) - 1]);
    }
  },
  tabInfo: {
    tabs: [],
    version: appVersion,
  },
  view: function (tabID) {
    if (tabID == null) return;
    tab.tabInfo.tabs.forEach((tab) => {
      tab.viewed = false;
      document.getElementById(tab.tabID + '-iframe').classList.add('hidden');
      document.getElementById(tab.tabID + '-tab').classList.remove('opened-tab');
    });
    tab.tabInfo.tabs.filter((tab) => tab.tabID == tabID)[0].viewed = true;
    document.getElementById(tabID + '-iframe').classList.remove('hidden');
    document.getElementById(tabID + '-tab').classList.add('opened-tab');
  },
  title: {
    get: function (tabID = tab.openedTab()) {
      return tab.tabInfo.tabs.filter((tab) => tab.tabID == tabID)[0].title;
    },
    change: function (tabID = tab.openedTab(), title = '新しいタブ') {
      this.tabInfo.tabs.filter((tab) => tab.tabID == tabID)[0].title = title;
      throw `指定されたタブID(${tabID})のタブが見つかりませんでした。`;
    },
  },
  openedTab: function () {
    return tab.tabInfo.tabs.filter((tab) => tab.viewed)[0].tabID;
  },
};
window.addEventListener('load', function (e) {
  tab.new();
});
