'use strict';

var fs = require('fs');
var stream = require('stream');

function serialize(timestamp, type, data) {
  return [
    timestamp,
    type,
    JSON.stringify(data)
  ].join('\t');
}

function deserialize(str) {
  var tok = str.split('\t');
  var result = {
    timestamp: +tok[0],
    type: tok[1],
    data: tok[2]
  };
  if (result.type === 'buffer') {
    result.data = new Buffer(JSON.parse(result.data));
  } else if (result.type === 'object') {
    result.data = JSON.parse(result.data);
  }
  return result;
}

function record(option) {
  var ts = stream.Transform(option);

  ts._transform = function(chunk, encoding, callback) {
    var type = 'unknown';
    if (Buffer.isBuffer(chunk)) {
      type = 'buffer';
    } else if (option.objectMode) {
      type = 'object';
    }
    this.push(serialize(Date.now(), type, chunk) + '\n');
    callback();
  }

  if (option.path) {
    ts.pipe(fs.createWriteStream(option.path));
  }

  return ts;
}

function replay(option) {
  var ts = stream.Transform(option);

  var lastLine = '';
  function byline(chunk) {
    var lines = chunk.toString().split('\n');
    lines[0] = lastLine + lines[0];
    lastLine = lines.pop();
    return lines;
  }

  var timeOffset;
  ts._transform = function(chunk, encoding, callback) {
    (function loop(lines) {
      var record = deserialize(lines.shift());
      if (typeof timeOffset === 'undefined') {
        timeOffset = Date.now() - record.timestamp;
      }
      var timeout = record.timestamp + timeOffset - Date.now();
      function push() {
        ts.push(record.data);
        if (lines.length > 0) {
          loop(lines);
        } else {
          callback();
        }
      }
      if (timeout > 0) {
        setTimeout(push, timeout);
      } else {
        process.nextTick(push);
      }
    })(byline(chunk));
  }

  if (option.path) {
    var rs = fs.createReadStream(option.path);
    rs.pipe(ts);
  }

  return ts;
}

exports.record = record;
exports.replay = replay;
