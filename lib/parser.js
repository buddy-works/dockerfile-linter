module.exports = {
  parseToLines: function (file) {
    let lines = [];

    file.split(/\r?\n/).map((line, index) => {
      if (line.length !== 0) {
        if (line[0].match(/\s/)) {
          lines.push({
            text: line.replace(/\s+/, "").trim(),
            lineNumber: index + 1
          })
        } else {
          lines.push({
            text: line.trim(),
            lineNumber: index + 1
          })
        }
      }
    });
    return lines
  }
};