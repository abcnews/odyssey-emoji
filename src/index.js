const emojiRegex = require('emoji-regex');
const styles = require('./styles.css');

const EMOJI_ONE_URL_ROOT = '//www.abc.net.au/res/sites/news-projects/assets-emoji-one/1.0.0/';
const EMOJI_ONE_DICT_URL = EMOJI_ONE_URL_ROOT + 'emoji.json';
const EMOJI_REGEX = emojiRegex();

function process(node) {
  const children = Array.prototype.slice.call(node.childNodes);

  if (children.length && children.every(isTextNode)) {
    replace(node);
  } else {
    children.forEach(process);
  }
}

function isTextNode(node) {
  return node.nodeType === 3;
}

function basename(str) {
  var r = [];
  var c = 0;
  var p = 0;
  var i = 0;
  var l = str.length;

  while (i < l) {
    c = str.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }

  return r.join('-');
}

function replace(node) {
  const container = document.createElement('div');
  let remainingText = node.outerHTML;
  let out = [];
  let match;

  while ((match = EMOJI_REGEX.exec(remainingText))) {
    out.push(remainingText.slice(0, match.index));
    out.push(
      `<img role="presentation" alt="${match[0]}" class=${styles.emoji} src="${EMOJI_ONE_URL_ROOT}svg/${basename(
        match[0]
      )}.svg" />`
    );

    remainingText = remainingText.slice(match.index + match[0].length);
  }

  out.push(remainingText);

  const html = out.join('');

  if (html !== node.outerHTML) {
    container.innerHTML = html;
    node.parentNode.replaceChild(container.firstChild, node);
  }
}

function init() {
  process(document.querySelector('.Main'));
}

if (window.__ODYSSEY__) {
  init();
} else {
  window.addEventListener('odyssey:api', e => {
    init();
  });
}
