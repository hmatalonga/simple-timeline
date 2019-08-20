const through2 = require('through2')

const rs = process.stdin
const ws = process.stdout

rs.pipe(through2((data, enc, cb) => {
    const content = data.toString()
    cb(null, Buffer.from(JSON.stringify(content)))
})).pipe(ws)
