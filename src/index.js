import { whenOdysseyLoaded } from '@abcnews/env-utils';
import emojiRegex from 'emoji-regex';
import styles from './styles.css';

const ALLOWED_INLINE_TAGS = ['BR', 'EM', 'STRONG'];
const EMOJI_ONE_URL_ROOT = '//cdn.jsdelivr.net/emojione/assets/3.1/png/64/';
const EMOJI_REGEX = emojiRegex();
const VARIATION_REGEX = /-fe0[\da-f]/g;
const ZWJ_REGEX = /-200d/g;

function process(node) {
  const children = Array.prototype.slice.call(node.childNodes);

  if (children.length && children.every(isTextNodeOrAlowedInlineElement)) {
    textNodesUnder(node).forEach(replace);
  } else {
    children.forEach(process);
  }
}

function isTextNode(node) {
  return node.nodeType === 3;
}

function isTextNodeOrAlowedInlineElement(node) {
  return isTextNode(node) || ALLOWED_INLINE_TAGS.indexOf(node.tagName) > -1;
}

function textNodesUnder(node) {
  let all = [];

  for (node = node.firstChild; node; node = node.nextSibling) {
    if (isTextNode(node)) {
      all.push(node);
    } else {
      all = all.concat(textNodesUnder(node));
    }
  }

  return all;
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
  const text = node.nodeValue;
  let replacements = [];
  let lastIndex = 0;
  let match;

  while ((match = EMOJI_REGEX.exec(text))) {
    const img = document.createElement('img');

    img.alt = match[0];
    img.className = styles.emoji;
    img.setAttribute('role', 'presentation');
    img.src = `${EMOJI_ONE_URL_ROOT}${basename(match[0]).replace(ZWJ_REGEX, '').replace(VARIATION_REGEX, '')}.png`;
    replacements.push(document.createTextNode(text.slice(lastIndex, match.index)));
    replacements.push(img);
    lastIndex = EMOJI_REGEX.lastIndex;
  }

  if (replacements.length === 0) {
    return;
  }

  replacements.push(document.createTextNode(text.slice(lastIndex)));

  replacements.forEach(replacement => {
    node.parentNode.insertBefore(replacement, node);
  });

  node.parentNode.removeChild(node);
}

whenOdysseyLoaded.then(() => process(document.querySelector('.Main')));
