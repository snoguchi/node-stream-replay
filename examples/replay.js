'use strict';

var fs = require('fs');
var replay = require('../').replay;

var filename = process.argv[2];

replay({path: filename})
  .pipe(process.stdout);
