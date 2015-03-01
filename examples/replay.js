'use strict';

var fs = require('fs');
var replay = require('../').replay;

var filename = process.argv[2];

replay(filename)
  .pipe(process.stdout);
