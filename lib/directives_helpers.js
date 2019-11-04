const directive_regex = /\b[A-Za-z]*\b\s?=/;
const directives = [
  'syntax',
  'escape'
];
module.exports = {
  lineContainDirective: function (lineText) {
    let regText = lineText.match(directive_regex);
    if (regText) {
      regText = regText[0].replace("=", "").trim();
      for (let index = 0; index < directives.length; index++) {
        if (directives[index] === regText.toLowerCase()) {
          return true
        }
      }
    }
    return false
  },
  directive_regex: directive_regex,
  directives: directives
};