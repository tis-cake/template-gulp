'use strict';

const gulp = require('gulp');
const del = require('del');
const fs = require('fs');

const concat = require('gulp-concat');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const server = require('browser-sync').create();

// const sass = require('gulp-sass');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCSS = require('gulp-clean-css');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;

const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');

const pug = require('gulp-pug');
const formatHTML = require('gulp-format-html');
const fileinclude = require('gulp-file-include');

const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

// DEV

// gulp.task('pug', function() {
//   return gulp.src('source/pug/pages/**/*.pug')
//     .pipe(plumber())
//     .pipe(pug({
//       pretty: true
//     }))
//     .pipe(formatHTML())
//     .pipe(gulp.dest('source/'))
//     .pipe(server.stream());
// });

// gulp.task('html-format', function() {
//   return gulp.src('source/*.html')
//     .pipe(formatHTML())
//     .pipe(gulp.dest('source/'))
// });

gulp.task('html-include', function() {
  return gulp.src('source/html/pages/**/*.html')
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('source/'))
    .pipe(server.stream());
});

gulp.task('css', function() {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less().on('error', notify.onError()))
    // .pipe(sass({outputStyle: 'expanded'}).on('error', notify.onError()))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('source/css'))
    .pipe(server.stream());
});

gulp.task('js', function() {
  return gulp.src('source/js/components/*.js')
    .pipe(plumber())
    .pipe(concat('main.js'))
    // .pipe(uglify().on('error', notify.onError()))
    // .pipe(uglify())
    .pipe(gulp.dest('source/js'))
    .pipe(server.stream());
});

gulp.task('server', function() {
  server.init({
    server: 'source/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  // gulp.watch('source/pug/**/*.pug', gulp.series('pug'));
  gulp.watch('source/html/**/*.html', gulp.series('html-include'));
  gulp.watch('source/less/**/*.less', gulp.series('css'));
  gulp.watch('source/js/**/*.js', gulp.series('js'));
  gulp.watch('source/img/svg-sprite/**/*.svg', gulp.series('svg-sprite'));
  gulp.watch('source/*.html').on('change', server.reload);
});

gulp.task('default', gulp.series('html-include', 'css', 'js', 'server'));

// опциональные таски

gulp.task('fonts', function() {
  gulp.src('source/fonts/ttf2/**/*.ttf')
    .pipe(ttf2woff())
    .pipe(gulp.dest('build/fonts/'))
  return gulp.src('source/fonts/ttf2/**/*.ttf')
    .pipe(ttf2woff2())
    .pipe(gulp.dest('build/fonts/'))
});

gulp.task('webp', function() {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest('build/img/webp'));
});

gulp.task('svg-sprite', function() {
  return gulp.src('source/img/svg-sprite/**/*.svg')
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('source/img'));
});

gulp.task('svg-rename', function() {
  let fullPath, parentPath;

  return gulp.src('source/img/icons/**/*.svg')
    .on('data', function(file) {
      fullPath = file.dirname;
    })

    .pipe(rename(function (file) {
      parentPath = fullPath.replace(/^.*\\/,'');
      file.basename = parentPath + '-' + file.basename;
    }))

    .pipe(gulp.dest('source/img/icons-rename'));
});

// BUILD

gulp.task('del', function() {
   return del(['build/*'])
});

gulp.task('css-build', function() {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(less().on('error', notify.onError()))
    // .pipe(sass({outputStyle: 'expanded'}).on('error', notify.onError()))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS({level: 2}))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('js-build', function() {
  return gulp.src('source/js/*.js')
    .pipe(plumber())
    .pipe(concat('main.js'))
    .pipe(babel({presets: ['@babel/env']}))
    .pipe(uglify({mangle: {toplevel: true}}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/js'))
});

gulp.task('html-include-build', function() {
  return gulp.src('source/html/pages/**/*.html')
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('build/'))
});

gulp.task('html-replace-build', function() {
  return gulp.src('build/**/*.html')
  .pipe(replace('href="css/style.css"', 'href="css/style.min.css"'))
  .pipe(replace('src="js/main.js"', 'src="js/main.min.js"'))
  .pipe(gulp.dest('build'));
});

gulp.task('copy-libs', function() {
  return gulp.src([
    'source/fonts/**/*',
    'source/css/libs/**/*',
    'source/js/libs/**/*'
    ], {'base' : 'source/'})
    .pipe(gulp.dest('build'));
})

gulp.task('img-min', function() {
  return gulp.src([
      'source/img/**/*.{png,jpg,jpeg,svg}',
      '!source/img/sprite.svg',
      '!source/img/svg-sprite/**/*',
    ])
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest('build/img'));
});

gulp.task('svg-sprite-min', function() {  
  return gulp.src('source/img/svg-sprite/**/*.svg')
    .pipe(imagemin([imagemin.svgo()]))
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
});

// gulp.task('svg-sprite-clean', function () {
//   return del(['build/img/svg-sprite'])
// });

// gulp.task('svg-sprite-build', gulp.series('svg-sprite-min', 'svg-sprite-clean'));

gulp.task('build', gulp.series('del', gulp.parallel('css-build', 'js-build', 'html-include-build', 'copy-libs', 'img-min', 'svg-sprite-min'), 'html-replace-build'));