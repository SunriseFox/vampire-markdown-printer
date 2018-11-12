const clickCopyListener = (e) => {
  e.stopImmediatePropagation()
  e = e.srcElement
  let text = e

  let range; let selection

  if (document.body.createTextRange) {
    range = document.body.createTextRange()
    range.moveToElementText(text)
    range.select()
  } else if (window.getSelection) {
    selection = window.getSelection()
    range = document.createRange()
    range.selectNodeContents(text)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  document.execCommand('copy')
}

let elems = document.querySelectorAll(':not(pre) > code')
elems.forEach(e => e.addEventListener('click', clickCopyListener))
