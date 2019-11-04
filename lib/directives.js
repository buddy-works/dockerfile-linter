const { lineContainDirective, directive_regex } = require('./directives_helpers');

const value_regex = /=(.+|$)/;

module.exports = {
  directivesParser: function (lines) {
    let directivesList = [];
    if (lines[0].text.startsWith("#") && lines[0].lineNumber === 1) {
      if (lineContainDirective(lines[0].text)) {
        for (let x = 0; x < lines.length; x++) {
          if (lines[x].text.startsWith("#") && lineContainDirective(lines[x].text)) {
            let directive = lines[x].text.match(directive_regex)[0].replace("=", "").trim();
            let value = lines[x].text.match(value_regex)[0].replace("=", "").trim();
            directivesList.push({
              directive: directive,
              value: value,
              lineNumber: lines[x].lineNumber
            })
          } else {
            return directivesList;
          }
        }
      }
    }
    return directivesList;
  },
  parseFromAliases: function (groups) {
    let aliases = [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].instruction.toUpperCase() === 'FROM') {
        let alias = groups[i].arguments[0].match(/(?<=(as|AS) )[\S]+/);
        if (alias) {
          aliases.push({
            name: alias[0].toLowerCase(),
            lineNumber: groups[i].linesNumbers[0]
          });
        } else {
          aliases.push({
            name: null,
            lineNumber: groups[i].linesNumbers[0]
          });
        }
      }
    }
    return aliases;
  },
  getEscape: function (directivesList) {
    let list = directivesList.filter((el) => {
      return el.directive.toLowerCase() === "escape"
    });
    if (list.length === 1 && list[0].value.length !== 0) {
      return list[0].value;
    } else {
      return "\\"
    }
  }
};