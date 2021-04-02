const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');
const { getRootPath, clearDist, external, onwarn, createPlugins } = require('../build/rollup-common-config');
const {
  linkVlsInCLI,
  watchVlsChange
} = require('../build/rollup-plugins.js');
const vlsPkg = require('./package.json');
const dts = require('rollup-plugin-dts').default;

const getVLSPath = getRootPath('server');

clearDist(getVLSPath('dist'));

function copySnippets() {
  return {
    name: 'copy-snippets',
    buildEnd() {
      fs.copySync(getVLSPath('src/modes/vue/MeteorSnippets'), getVLSPath('dist/MeteorSnippets'), {
        overwrite: true,
        recursive: true
      });
    }
  };
}

function copyTSDefaultLibs() {
  return {
    name: 'copy-ts-default-libs',
    buildEnd() {
      const files = fg.sync('node_modules/typescript/lib/lib*.d.ts', {
        cwd: getVLSPath(''),
        unique: true,
        absolute: true
      });
      files.forEach(file => fs.copySync(file, getVLSPath('dist/' + path.basename(file)), { overwrite: true }));
    }
  };
}

module.exports = [
  // meteorServerMain
  {
    input: getVLSPath('src/meteorServerMain.ts'),
    output: { file: getVLSPath('dist/meteorServerMain.js'), name: vlsPkg.name, format: 'cjs', sourcemap: true },
    external,
    onwarn,
    watch: {
      include: getVLSPath('**')
    },
    plugins: [
      watchVlsChange(),
      // bundleVlsWithEsbuild(),
      // copySnippets(),
      // copyTSDefaultLibs(),
      linkVlsInCLI(),
      ...createPlugins(getVLSPath('tsconfig.json'))
    ]
  }
];
