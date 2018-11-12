const q = document.querySelectorAll.bind(document)
const titles = q('h2,h3,h4')
const exercises = q('section[type="exercise"]')
const questions = q('section[type="question"]')
const challenges = q('section[type="challenge"]')

const hashTo = (param) => {
  if (typeof param === 'string')
    param = document.querySelector(param);
  console.log(param.offsetTop - 50)
  window.scrollTo({top: param.offsetTop - 50})
  history.replaceState({}, '', '#' + param.getAttribute('id'))
}
let i = 0;
const arr = Array.prototype.slice.call(titles)
let lastTag = 'H '
const stack = []
const result = []
arr.map(title => {
  i++;
  title.setAttribute('id', 'title-' + i)
  const a = title.innerHTML.split('/')
  const t = a.length === 1 ? a[0] : a[1]
  const e = `<a onclick="hashTo('#title-${i}')">${t}</a>`
  if (title.tagName > lastTag) {
    result.push(`<ul><li>${e}`)
    stack.push(title.tagName)
  } else if (title.tagName === lastTag) {
    result.push(`</li><li>${e}`)
  } else {
    while (stack[stack.length - 1] > title.tagName) {
      stack.pop()
      result.push('</li></ul>')
    }
    result.push(`</li><li>${e}`)
  }
  lastTag = title.tagName
})
while (stack.pop()) {
  result.push('</li></ul>')
}

document.querySelector('#titleDir').innerHTML = result.join('');

const getStr = (elems, key, name) => {
  const arr = Array.prototype.slice.call(elems)
  const result = []
  result.push('<ul>')
  arr.map((elem, i) => {
    i = i + 1
    elem.setAttribute('id', `${key}${i}`)
    result.push(`<li><a onclick="hashTo('#${key}${i}')">${name} ${i}</a></li>`)
  })
  result.push('</ul>')
  return result.join('')
}

document.querySelector('#exerciseDir').innerHTML = getStr(exercises, 'exercise', '练习');
document.querySelector('#questionDir').innerHTML = getStr(questions, 'question', '问题');
document.querySelector('#challengeDir').innerHTML = getStr(challenges, 'challenge', '挑战');

const stopPropagation = (e) => {
  e.stopImmediatePropagation();
}

const activateSideBar = (e) => {
  e.stopImmediatePropagation();
  document.querySelector('.left-bar-wrapper').classList.add('is-active')
}

const deactivateSideBar = (e) => {
  document.querySelector('.left-bar-wrapper').classList.remove('is-active')
}

document.querySelector('.left-bar-wrapper').addEventListener('click', stopPropagation, false);
document.querySelector('.left-bar-control').addEventListener('click', activateSideBar, false);
document.addEventListener('click', deactivateSideBar, false);

window.addEventListener('load', () => {
  if (window.location.hash) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    hashTo(window.location.hash)
  }
}, false)
