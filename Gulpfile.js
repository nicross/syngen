const {EOL} = require('os')
const concat = require('gulp-concat')
const del = require('del')
const header = require('gulp-header')
const gulp = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const package = require('./package.json')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default

gulp.task('clean', () => del(['dist', 'docs']))

gulp.task('dist', () => {
  const comment = `/* ${package.name} v${package.version} */${EOL}`

  return gulp.src(getJs())
    .pipe(header(comment))
    .pipe(concat('syngen.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(comment))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('dist'))
})

gulp.task('docs', (done) => {
  gulp.src([
    'README.md',
    'src/syngen.js',
    'src/syngen/**/*.js',
  ]).pipe(jsdoc({
    opts: {
      destination: 'docs',
      readme: 'README.md',
      template: 'node_modules/jsdoc/templates/default',
    },
    plugins: [
      'plugins/markdown',
    ],
    tags: {
      allowUnknownTags: true,
    },
    templates: {
      monospaceLinks: true,
      default: {
        includeDate: false,
        useLongnameInNav: true,
      },
    },
  }, done))
})

gulp.task('build', gulp.series('clean', 'dist', 'docs'))

gulp.task('watch', () => {
  gulp.watch('src/**', gulp.series('build'))
})

function getJs() {
  return [
    'src/wrapper/header.js',
    'src/syngen.js',
    'src/syngen/const.js',
    'src/syngen/fn.js',
    'src/syngen/tool/*.js',
    'src/syngen/loop.js',
    'src/syngen/state.js',
    'src/syngen/buffer/*.js',
    'src/syngen/ear/filterModel/base.js',
    'src/syngen/ear/filterModel/*.js',
    'src/syngen/ear/gainModel/base.js',
    'src/syngen/ear/gainModel/*.js',
    'src/syngen/mixer.js',
    'src/syngen/mixer/reverb.js',
    'src/syngen/mixer/reverb/gainModel/base.js',
    'src/syngen/mixer/reverb/gainModel/*.js',
    'src/syngen/*.js',
    'src/syngen/*/*.js',
    'src/syngen/*/*/*.js',
    'src/wrapper/footer.js',
  ]
}
