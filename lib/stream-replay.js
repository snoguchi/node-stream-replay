'use strict';

var stream = require('stream');

function serialize(timestamp, encoding, data) {
  return [
    timestamp,
    encoding,
    JSON.stringify(data)
  ].join('\t');
}

function deserialize(str) {
  var tok = str.split('\t');
  var result = {
    timestamp: +tok[0],
    encoding: tok[1],
    data: tok[2]
  };
  if (result.encoding === 'buffer') {
    result.data = new Buffer(JSON.parse(result.data));
  }
  return result;
}

function record() {
  var ts = stream.Transform();
  ts._transform = function(chunk, encoding, callback) {
    if (Buffer.isBuffer(chunk)) {
      this.push(serialize(Date.now(), encoding, chunk) + '\n');
      callback();
    } else {
      callback(arguments);
    }
  }
  return ts;
}

function replay() {
  var ts = stream.Transform();

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

  return ts;
}

exports.record = record;
exports.replay = replay;
