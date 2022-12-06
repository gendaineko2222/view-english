/**
 * ファイルを編集します。
 */
function editFile(tabID = tab.openedTab()) {
  let title, main
  let wayakuArrary = viewHTMLtoArray(tab.getHTMLcontent(tabID))
  if (wayakuArrary) {
    [title, main] = arrayToText(wayakuArrary)
  } else {
    title = '新しいファイル'
    main = '英文、日本語の順に改行して入力してください。(これは必ず消してください。)'
  }
  const editHTML =
    `<div class="edit-file"><div class="edit-header"><input value="${title}" class="edit-title" onchange="editChangeHTML()" id="editTitle"><button class="edit-filish" onclick="finishEdit()">完了</button></div><textarea id="editMain" onchange="editChangeHTML()" class="edit-main">${main}</textarea></div>`
  tab.viewHTMLcontent(tab.openedTab(), editHTML, title)
  tab.changeTaborder()
  tab.view()
}
function editChangeHTML() {
  tab.changeHTMLcontentOnlyTabInfo(tab.openedTab(), `
    <div class="edit-file"><div class="edit-header"><input value="${document.getElementById('editTitle').value}" class="edit-title" id="editTitle" onchange="editChangeHTML()"><button class="edit-filish" onclick="finishEdit()">完了</button></div><textarea id="editMain" onchange="editChangeHTML()" class="edit-main">${document.getElementById('editMain').value}</textarea></div>
  `)
}
function finishEdit(tabID = tab.openedTab()) {
  const title = document.getElementById('editTitle').value;
  const data = document.getElementById('editMain').value;
  const wayakuData = arrayToViewHTML(textToArray(title, data))
  tab.viewHTMLcontent(tabID, wayakuData, title)
  tab.saveTabInfo();
  tab.changeTaborder()
  tab.view(tabID)
}
function newFile() {
  tab.new()
  tab.view()
  editFile()
}
document.getElementById('headerFileMenu').innerHTML += `
  <button class="header-file-menu-button" onclick="editFile()">編集</button>
`
finishedScriptNumber++