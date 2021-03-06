// Generated on 2016-02-12 using generator-angular 0.15.1
'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var openURL = require('open');
var lazypipe = require('lazypipe');
var rimraf = require('rimraf');
var wiredep = require('wiredep').stream;
var runSequence = require('run-sequence');

var yeoman = {
  app: require('./bower.json').appPath || 'app',
  server: 'server',
  dist: 'dist'
};

var paths = {
  scripts: [yeoman.app + '/scripts/**/*.js'],
  styles: [yeoman.app + '/styles/**/*.scss'],
  test: ['test/spec/**/*.js'],
  testRequire: [
    'bower_components/angular/angular.js',
    'bower_components/angular-mocks/angular-mocks.js',
    'bower_components/angular-resource/angular-resource.js',
    'bower_components/angular-cookies/angular-cookies.js',
    'bower_components/angular-sanitize/angular-sanitize.js',
    'bower_components/angular-route/angular-route.js',
    'bower_components/angular-animate/angular-animate.js',
    yeoman.app + '/scripts/app.js',
    'test/mock/**/*.js',
    'test/spec/**/*.js'
  ],
  karma: 'test/karma.conf.js',
  views: {
    main: yeoman.app + '/index.html',
    files: [yeoman.app + '/views/**/*.html']
  }
};

////////////////////////
// Reusable pipelines //
////////////////////////

var lintScripts = lazypipe()
  .pipe($.jshint, '.jshintrc')
  .pipe($.jshint.reporter, 'jshint-stylish');

var styles = lazypipe()
  .pipe($.sass, {
    outputStyle: 'expanded',
    precision: 10
  })
  .pipe($.autoprefixer, 'last 1 version')
  .pipe(gulp.dest, yeoman.app + '/styles');

///////////
// Tasks //
///////////

gulp.task('styles', function () {
  return gulp.src(paths.styles)
    .pipe(styles());
});

gulp.task('lint:scripts', function () {
  return gulp.src(paths.scripts)
    .pipe(lintScripts());
});

gulp.task('clean:tmp', function (cb) {
  rimraf('./.tmp', cb);
});

gulp.task('start:client', ['start:server', 'styles'], function () {
  openURL('http://localhost:9000/app', "Google Chrome");
  // my linux
  // openURL('http://localhost:9000/app');
});

gulp.task('start:server', function() {
  $.connect.server({
    root: ['./', yeoman.app],
    livereload: true,
    // Change this to '0.0.0.0' to access the server from outside.
    port: 9000
  });
});

gulp.task('start:server:test', function() {
  $.connect.server({
    root: ['test', yeoman.app, '.tmp'],
    livereload: true,
    port: 9001
  });
});

gulp.task('watch', function () {
  $.watch(paths.styles)
    .pipe($.plumber())
    .pipe(styles())
    .pipe($.connect.reload());

  $.watch(paths.views.files)
    .pipe($.plumber())
    .pipe($.connect.reload());

  $.watch(paths.scripts)
    .pipe($.plumber())
    .pipe(lintScripts())
    .pipe($.connect.reload());

  $.watch(paths.test)
    .pipe($.plumber())
    .pipe(lintScripts());

  gulp.watch('bower.json', ['bower']);
});

gulp.task('serve', function (cb) {
  runSequence('clean:tmp',
    ['lint:scripts'],
    ['start:client'],
    'watch', cb);
});

gulp.task('serve:prod', function() {
  $.connect.server({
    root: [yeoman.dist],
    livereload: true,
    port: 9000
  });
});

gulp.task('test', ['start:server:test'], function () {
  var testToFiles = paths.testRequire.concat(paths.scripts, paths.test);

  // console.log(testToFiles);

  return gulp.src(testToFiles)
    .pipe($.karma({
      configFile: paths.karma,
      action: 'watch'
    }));
});

// inject bower components
gulp.task('bower', function () {
  gulp.src(paths.views.main)
    .pipe(wiredep({
      optional: 'configuration',
      goes: 'here',
      exclude: [
        'bower_components/videojs/dist/video-js/video-js.css',
        'bower_components/bootstrap/dist/js/bootstrap.js',
        'bower_components/videojs/dist/video-js/video.js',
        'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'bower_components/flat-ui/dist/js/flat-ui.js'
      ],
      ignorePath: '\.\.'
    }))
    .pipe(gulp.dest(yeoman.app));

  // return gulp.src(paths.views.main)
  //   .pipe(wiredep({
  //     directory: yeoman.app + '/bower_components',
  //     ignorePath: '..'
  //   }))
  // .pipe(gulp.dest(yeoman.app + '/views'));
});

///////////
// Build //
///////////

gulp.task('clean:dist', function (cb) {
  rimraf('./dist', cb);
});

gulp.task('client:build', ['html', 'styles'], function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src(paths.views.main)
    .pipe($.useref({searchPath: [yeoman.app]}))
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.minifyCss({cache: true}))
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe($.revReplace())
    .pipe(gulp.dest(yeoman.dist));
});

gulp.task('html', function () {
  return gulp.src(yeoman.app + '/views/**/*')
    .pipe(gulp.dest(yeoman.dist + '/views'));
});

gulp.task('images', function () {
  return gulp.src(yeoman.app + '/images/**/*')
    .pipe($.cache($.imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest(yeoman.dist + '/images'));
});

gulp.task('copy:extras', function () {
  return gulp.src(yeoman.app + '/*/.*', { dot: true })
    .pipe(gulp.dest(yeoman.dist));
});

gulp.task('copy:fonts', function () {
  gulp.src('bower_components/bootstrap/fonts/**/*')
    .pipe(gulp.dest(yeoman.dist + '/fonts'));

  gulp.src('bower_components/flat-ui/fonts/**/*')
    .pipe(gulp.dest(yeoman.dist + '/fonts'));

});

gulp.task('server:build', function () {

  gulp.src(yeoman.server+'/*.*')
    .pipe(gulp.dest(yeoman.dist+'/server'));

  gulp.src(['package.json','README.md'])
    .pipe(gulp.dest(yeoman.dist));
});

gulp.task('build', ['clean:dist'], function () {
  runSequence(['images', 'copy:extras', 'copy:fonts', 'client:build', 'server:build'], 'renameIndex', 'zip');

});

gulp.task('renameIndex', function () {
  gulp.src(yeoman.dist+'/*.html')
    .pipe($.rename({
      basename:"index",
      extname: ".html"
    }))
    .pipe(gulp.dest(yeoman.dist));
});

gulp.task('zip', function () {
  return gulp.src(yeoman.dist+'/**/*.*')
		.pipe($.zip('db_dictionary_build.zip'))
		.pipe(gulp.dest(yeoman.dist));
});



gulp.task('default', ['build']);
