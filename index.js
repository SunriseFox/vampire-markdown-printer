#!/usr/bin/env node

const fs = require('fs');
const { R_OK } = fs
const path = require('path')
const hljs = require('highlight.js');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const MarkdownIt = require('markdown-it');
const container = require('markdown-it-container');
const sass = require('sass');
const babel = require('@babel/core');

const sr = p =>
  path.join(__dirname, p)

const encoding = 'utf8'

const yargs = require('yargs')
.array('input').array('output').boolean('dry')
.alias('input', 'i')
.alias('output', 'o')
.describe('input', 'input files')
.describe('output', 'output files')
.describe('inputDir', 'input Dir')
.describe('outputDir', 'output Dir')
.describe('base', 'resources (i.e. images) base location')
.describe('dry', 'preview input and output (creates dir)')
.conflicts('input', ['inputDir'])
.conflicts('output', ['outputDir', 'inputDir'])
.help().argv;

let inputs;
let outputs;
let base = yargs.base || '';
if (yargs.inputDir) {
  inputs = fs.readdirSync(yargs.inputDir).filter(i => i.endsWith('.md')).map(i => path.join(yargs.inputDir, i));
} else if (yargs.input) {
  inputs = yargs.input.filter(i => i.endsWith('.md'))
} else {
  inputs = yargs._.filter(i => i.endsWith('.md'))
}
inputs.forEach(i => fs.accessSync(i, R_OK));
if (yargs.output) {
  outputs = yargs.output
} else {
  if (yargs.outputDir)
    fs.mkdirSync(yargs.outputDir, {recursive: true, mode: 0o666})
  const dir = yargs.outputDir
  outputs = inputs.map((i) => {
    return path.join(dir || path.dirname(i), path.basename(i, '.md') + '.html')
  })
}
if (inputs.length !== outputs.length)
  throw new Error('input/output length is not match');

if(yargs.dry) {
  console.log('inputs: ', inputs.join(', '))
  console.log('outputs: ', outputs.join(', '))
  console.log('[warn] this is a dry run, nothing is proceeded')
  process.exit(1);
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str, true).value;
      } catch (_) {}
    }
    return '';
  }
});

const parser = {
  validate: function(params) {
    return params.trim().match(/^(\w+?)\s+(.*)$/);
  },
  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^(\w+?)\s+(.*)$/);
    if (tokens[idx].nesting === 1) {
      var $2 = md.utils.escapeHtml(m[1]);
      var $3 = md.utils.escapeHtml(m[2]);
      return '<section class="custom-block ' + $2 + '" type="' + $2 + '"><strong>' + $3 + '</strong>\n';
    } else {
      return '</section>\n';
    }
  }
}

md.use(container, '*', parser);

let promises = [];

for (let i = 0; i < inputs.length; i++) {
  promises.push(
    (async () => {
      const file = fs.readFileSync(inputs[i], {encoding});
      const markdown = md.render(file).trim();
      const style = sass.renderSync({file: sr('./stylesheets/index.scss')}).css.toString('utf8');
      let script = '';
      const dir = fs.readdirSync(sr('./scripts/'));
      for (const i of dir) {
        script += babel.transformFileSync(sr(path.join('./scripts/', i))).code + '\n'
      }
      const template = fs.readFileSync(sr('./template.html'), {encoding});
      const title = 'Vampire Markdown';
      const sandbox = vm.createContext({title, markdown, style, script})
      vm.runInContext('result = ' + 'String.raw`' + template.replace(/`/g, '${\'`\'}') + '`', sandbox);
      const {result} = sandbox;
      const dom = new JSDOM(result);
      const {document} = dom.window;
      const images = document.querySelectorAll('img');
      for (const image of images) {
        const src = image.getAttribute('src');
        if(src) {
          let encode = require('./encodeBase64');
          let base64 = src;
          let target = [path.resolve(base, src), path.resolve(path.dirname(inputs[i]), src), src]
          for (const i of target) {
            try {
              fs.accessSync(i, R_OK);
              base64 = await encode(i);
              break;
            } catch (_) { }
          }
          image.setAttribute('src', base64);
        }
      }
      fs.writeFileSync(outputs[i], dom.serialize())
    })()
  )
}

Promise.all(promises).catch(e => {
  console.error(e)
  process.exit(1)
})
