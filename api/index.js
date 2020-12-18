const { router, post } = require('microrouter')
const { json, send, createError } = require('micro')
const retext = require('retext')
const pos = require('retext-pos')
const keywords = require('retext-keywords')
const toString = require('nlcst-to-string')

const retextInst = retext()
  .use(pos)
  .use(keywords)

function getKeywords(text) {
  return new Promise((resolve, reject) => {
    retextInst.process(text, function (err, file) {
      if (err)
        return reject(err)
      const keywords = file.data.keywords.map(kw => toString(kw.matches[0].node))
      const kwPhrases = file.data.keyphrases.map(kw => kw.matches[0].nodes.map(n => toString(n)).join(''))
      return resolve({ keywords, kwPhrases })
    })
  })
}

function replaceErrors(key, value) {
  if (value instanceof Error) {
    var error = {};
    Object.getOwnPropertyNames(value).forEach(function (key) {
      error[key] = value[key];
    });
    return error;
  }
  return value;
}

function errorHandler(error, res) {
  const defaultCode = 503
  let code = defaultCode
  if (error.hasOwnProperty('statusCode') && error['statusCode'])
    code = error['statusCode']
  send(res, code, JSON.parse(JSON.stringify({ error }, replaceErrors)));
}

module.exports = router(
  post('/keywords', async function (req, res) {
    const body = await json(req)
    const text = body['text']
    if (!text) {
      return errorHandler(createError(400, 'empty text'), res)
    }
    getKeywords(text)
      .then(result => send(res, 200, result))
      .catch(err => errorHandler(err, res));
  })
);