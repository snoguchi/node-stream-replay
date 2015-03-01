'use strict';

var fs = require('fs');
var replay = require('../').replay;

var filename = process.argv[2];

fs.createReadStream(filename)
  .pipe(replay())
  .pipe(process.stdout);
