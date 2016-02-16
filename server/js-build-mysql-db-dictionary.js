'use strict';

var mysql = require('mysql');
var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('underscore');

var DATABASE = 'mianshi';

var filePaths = [
  'data/table_info',
  'data/sql',
  'data/md'
];

var tableTemp = {
  tableName:'',
  fields: []
};

var fieldTemp = {
  Field: '',
  Type: '',
  Collation: '',
  Null: '',
  Key: '',
  Default: null,
  Extra: '',
  Comment: ''
};

var descTemp = {
  Name: '',
  Engine: '',
  Comment: ''
};



//创建连接
var connection = mysql.createConnection({
  host     : '182.92.163.224',
  user     : 'root',
  password : '9aa0f5be39',
  database : DATABASE
});

async.waterfall([
  // 尝试创建相关路径
  function (cb) {

    async.mapSeries(filePaths,
      function (item, callback) {
        mkdirp(item, callback);
      },function(err) {
        cb(err);
    });

  },
  // 尝试连接数据库
  function( cb) {
    connection.connect(function(err) {
      return cb(err);
    });

  },
  function ( cb) {

    // connection.query('SELECT 1 + 1 AS solution', function(err, rows) {
    //   if (err) {
    //     return cb(err);
    //   } else {
    //     console.log('The solution is: ', rows[0].solution);
    //     cb();
    //   }
    // });

    connection.query("SHOW TABLE STATUS" , function(err, rows) {
      if (err) {
          return cb(err);
        } else {
          var allKeyArr, // 需要的 key 转成数组形式
           mapRows; // 最终传递的 rows

          // console.log(rows);

          allKeyArr = _.allKeys(descTemp);

          // console.log(allKeyArr);
          //[ 'Name', 'Engine', 'Comment' ]

          mapRows = _.map(rows, function (item) {
            var cpItem =  _.extend({}, item);
            // var argArr = [cpItem].concat(allKeyArr);
            var needData = _.pick.apply(_, [cpItem].concat(allKeyArr));
            // console.log(needData);
            return needData;
          });

          // console.log(mapRows);

          fs.writeFile('data/all_tables.json',
              JSON.stringify(mapRows, null, "\t"),
              function (err) {
                  cb(err, mapRows);
            });

          // cb(null, mapRows);
        }
    });
  },
  function (rows, cb) {

    async.mapSeries(rows,
      function (item, callback) {

        var tableName = item.Name;

        connection.query("SHOW FULL COLUMNS FROM " + tableName, function (err, rows) {
          // console.log(tableName);
          // console.log('---');
          // console.log(rows);

          var allKeyArr, // 需要的 key 转成数组形式
           mapRows, // 最终传递的 rows
           tableSaveData = {};

           allKeyArr = _.allKeys(fieldTemp);
           mapRows = _.map(rows, function (item) {
             var cpItem =  _.extend({}, item);
             var needData = _.pick.apply(_, [cpItem].concat(allKeyArr));
             return needData;
           });

           _.extend(tableSaveData, tableTemp);

           tableSaveData.tableName = tableName;
           tableSaveData.fields = mapRows;

          //  console.log(tableSaveData);

           fs.writeFile('data/table_info/'+tableName+'.json',
               JSON.stringify(tableSaveData, null, "\t"),
               function (err) {
                return   callback(err, tableSaveData);
             });
        });
    }, function(err, tableNames) {
      cb(err, tableNames);
    });

  }
], function (err) {
  connection.end();

  // fs.writeFile('data/all.js', JSON.stringify({'tmp':'123'}), function (err) {
  //       if (err) {
  //         throw err;
  //       }
  //       console.log("Export Account Success!");
  //   });
  if(err) {
    throw err;
  }
});