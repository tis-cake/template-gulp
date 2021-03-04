import gulp from 'gulp';
import del from 'del';
import fs from 'fs';

import notify from 'gulp-notify';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import plumber from 'gulp-plumber';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';

import less from 'gulp-less';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import minCSS from 'gulp-clean-css';

import babel from 'gulp-babel';
import minJS from 'gulp-terser';

import webpack from 'webpack';
import webpackStream from 'webpack-stream';

import webp from 'gulp-webp';
import imagemin from 'gulp-imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import svgstore from 'gulp-svgstore';

import minHTML from 'gulp-htmlmin';
import formatHTML from 'gulp-format-html';
import fileinclude from 'gulp-file-include';

import ttf2woff from 'gulp-ttf2woff';
import ttf2woff2 from 'gulp-ttf2woff2';

// DEV

export const htmlInclude = () => {
  return gulp.src('source/html/pages/**/*.html')
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file',
    }))
    .pipe(gulp.dest('source/'))
    .pipe(server.stream());
};

export const css = () => {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(less().on('error', notify.onError()))
    // .pipe(sass({outputStyle: 'expanded'}).on('error', notify.onError()))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('source/css'))
    .pipe(browserSync.stream());
};

export const js = () => {
  return gulp.src('source/js/main.js')
    .pipe(webpackStream(
      {
        mode: 'development',
        output: {
          filename: 'build.js',
        },
        module: {
          rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }]
        },
      }
    ))
    .on('error', function (err) {
      console.error('WEBPACK ERROR', err);
      this.emit('end'); // Don't stop the rest of the task
    })

    .pipe(sourcemaps.init())
    .pipe(minJS({
      toplevel: true,
      format: {
        comments: false,
      },
    }))

    // .pipe(rename('main.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('source/js'))
    .pipe(browserSync.stream());
};

export const watch = () => {
  gulp.watch('source/html/**/*.html', htmlInclude);
  gulp.watch('source/less/**/*.less', css);
  gulp.watch(['source/js/components/**/*.js', 'source/js/main.js'], js);
  gulp.watch('source/img/svg-sprite/**/*.svg', svgSprite);
  gulp.watch('source/*.html').on('change', browserSync.reload);
};

export const server = () => {
  browserSync.init({
    notify: false,
    open: true,
    cors: true,
    ui: false,
    server: {
      baseDir: 'source/',
      routes: {
        'node_modules/': 'node_modules',
      },
    },
  });
};


export default gulp.series(gulp.parallel(css, js), gulp.parallel(watch, server));

// опциональные таски

// export const htmlPUG = () => {
//   return gulp.src('source/pug/pages/**/*.pug')
//     .pipe(plumber())
//     .pipe(pug({
//       pretty: true
//     }))
//     .pipe(formatHTML())
//     .pipe(gulp.dest('source/'))
//     .pipe(server.stream());
// };

// export const htmlFormat = () => {
//   return gulp.src('source/*.html')
//     .pipe(formatHTML())
//     .pipe(gulp.dest('source/'))
// };

export const fontToWoff = () => {
  gulp.src('source/fonts/ttf2/**/*.ttf')
    .pipe(ttf2woff())
    .pipe(gulp.dest('source/fonts/'))
  return gulp.src('source/fonts/ttf2/**/*.ttf')
    .pipe(ttf2woff2())
    .pipe(gulp.dest('source/fonts/'));
};

export const imgToWebp = () => {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest('build/img/webp'));
};

export const svgSprite = () => {
  return gulp.src('source/img/svg-sprite/**/*.svg')
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('source/img'));
};

export const svgRename = () => {
  let fullPath, parentPath;

  return gulp.src('source/img/icons/**/*.svg')
    .on('data', function(file) {
      fullPath = file.dirname;
    })

    .pipe(rename(function (file) {
      parentPath = fullPath.replace(/^.*\\/, '');
      file.basename = parentPath + '-' + file.basename;
    }))

    .pipe(gulp.dest('source/img/icons-rename'));
};

// BUILD

export const delFiles = () => {
  return del(['build/*']);
};

export const copyLibs = () => {
  return gulp.src([
    'source/fonts/**/*',
    '!source/fonts/ttf2',
    '!source/fonts/ttf2/**/*',

    'source/css/libs/**/*',
    'source/js/libs/**/*',
    ], {'base' : 'source/'})
    .pipe(gulp.dest('build'))
};

export const cssBuild = () => {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(less().on('error', notify.onError()))
    // .pipe(sass({outputStyle: 'expanded'}).on('error', notify.onError()))
    .pipe(postcss([autoprefixer()]))
    .pipe(minCSS({level: 2}))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css'))
};

export const jsBuild = () => {
  return gulp.src('source/js/components/common.js')
    .pipe(webpackStream(
      {
        mode: 'production',
        output: {
          filename: 'build.js',
        },
        module: {
          rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }]
        },
      }
    ))
    .on('error', function (err) {
      console.error('WEBPACK ERROR', err);
      this.emit('end'); // Don't stop the rest of the task
    })
    .pipe(minJS({
      toplevel: true,
      format: {
        comments: false,
      },
    }))
    // .pipe(rename('build.min.js'))
    .pipe(gulp.dest('build/js'))
};

// without html templates
export const htmlBuild = () => {
  return gulp.src('source/*.html')
    .pipe(gulp.dest('build/'));
};

// including html templates
export const htmlIncludeBuild = () => {
  return gulp.src('source/html/pages/**/*.html')
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file',
    }))
    .pipe(gulp.dest('build/'));
};

export const htmlReplaceBuild = () => {
  return gulp.src('build/**/*.html')
    .pipe(replace('href="css/style.css"', 'href="css/style.min.css"'))
    .pipe(replace('src="js/build.js"', 'src="js/build.min.js"'))
    .pipe(gulp.dest('build'));
};

export const htmlMin = () => {
  return gulp.src('build/**/*.html')
    .pipe(minHTML({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('build'));
};

export const imgMin = () => {
  return gulp.src([
    'source/img/**/*.{png,jpg,jpeg,svg}',
    '!source/img/sprite.svg',
    '!source/img/svg-sprite/**/*',
    ])
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imageminJpegtran({ progressive: true }),
      imagemin.svgo(),
    ]))
    .pipe(gulp.dest('build/img'));
};

export const svgSpriteMin = () => {
  return gulp.src('source/img/svg-sprite/**/*.svg')
    .pipe(imagemin([imagemin.svgo()]))
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
};

export const build = gulp.series(
  delFiles,
  gulp.parallel(
    cssBuild,
    jsBuild,
    htmlBuild,
    copyLibs,
    imgMin,
    svgSpriteMin
  ),
  htmlReplaceBuild,
  htmlMin
);
