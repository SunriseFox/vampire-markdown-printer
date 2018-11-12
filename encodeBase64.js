// from https://gist.github.com/james2doyle/a4cff8e12456318c71b1

const mime = require('mime');
const fs = require('fs').promises;

module.exports = async function (filepath) {
  const filemime = mime.getType(filepath);
  const data = await fs.readFile(filepath, {encoding: 'base64'});
  return `data:${filemime};base64,${data}`;
}
