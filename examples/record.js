'use strict';

var fs = require('fs');
var record = require('../').record;

var filename = process.argv[2];

process.stdin
  .pipe(record())
  .pipe(fs.createWriteStream(filename));
