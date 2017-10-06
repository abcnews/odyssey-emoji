const emojiRegex = require('emoji-regex');
const styles = require('./styles.css');

const EMOJI_ONE_URL_ROOT = '//cdn.jsdelivr.net/emojione/assets/3.1/png/64/';
const EMOJI_REGEX = emojiRegex();
const ZWJ_REGEX = /-200d/g;
const VARIATION_REGEX = /-fe0[\da-f]/g;

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
  let html = node.outerHTML;
  let out = [];
  let match;
  let lastIndex = 0;

  while ((match = EMOJI_REGEX.exec(html))) {
    const src = `${EMOJI_ONE_URL_ROOT}${basename(match[0])
      .replace(ZWJ_REGEX, '')
      .replace(VARIATION_REGEX, '')}.png`;

    out.push(html.slice(lastIndex, match.index));
    out.push(`<img role="presentation" alt="${match[0]}" class=${styles.emoji} src="${src}" />`);
    lastIndex = EMOJI_REGEX.lastIndex;
  }

  out.push(html.slice(lastIndex));

  const transformedHtml = out.join('');

  if (transformedHtml === node.outerHTML) {
    return;
  }

  const tmp = document.createElement('div');

  tmp.innerHTML = transformedHtml;
  node.parentNode.replaceChild(tmp.firstChild, node);
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
