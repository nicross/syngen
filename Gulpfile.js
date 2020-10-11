const concat = require('gulp-concat')
const {EOL} = require('os')
const header = require('gulp-header')
const gulp = require('gulp')
const package = require('./package.json')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default

gulp.task('build', () => {
  const comment = `/*! ${package.name} v${package.version} */${EOL}`

  return gulp.src(getJs())
    .pipe(concat('syngen.js'))
    .pipe(header(comment))
    .pipe(gulp.dest('dist'))
    .pipe(uglify({
      output: {
        comments: /^!/,
      },
    }))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('dist'))
})

gulp.task('watch', () => {
  gulp.watch('src/**', gulp.series('build'))
})

function getJs() {
  return [
    'src/wrapper/header.js',
    'src/syngen.js',
    'src/syngen/utility.js',
    'src/syngen/utility/*.js',
    'src/syngen/utility/**/*.js',
    'src/syngen/const.js',
    'src/syngen/state.js',
    'src/syngen/seed.js',
    'src/syngen/audio.js',
    'src/syngen/audio/*.js',
    'src/syngen/audio/buffer/**/*.js',
    'src/syngen/audio/**/*.js',
    'src/syngen/loop.js',
    'src/syngen/input/*.js',
    'src/syngen/performance.js',
    'src/syngen/position.js',
    'src/syngen/prop/base.js',
    'src/syngen/prop/null.js',
    'src/syngen/props.js',
    'src/syngen/streamer.js',
    'src/wrapper/footer.js',
  ]
}
