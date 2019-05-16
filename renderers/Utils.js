/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const fs_extra = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

const Utils = {
  /**
   * @param { string } templateDir
   */
  loadTemplates(templateDir) {
    // 1. load codegen main templates
    // 2. load codegen partial templates
    // 3. discover files need to copy to the sdk folder
    const mainTemplates = [];
    const partialTemplates = {};
    const versionedTemplates = [];
    const filesNeedCopy = [];
    /**
     * @param {string} dir
     */
    const walkTemplateDir = dir => {
      const relativeDir = dir.substring(templateDir.length) + path.sep;
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkTemplateDir(fullPath);
        } else if (stat.isFile()) {
          let match = file.match(/^(.*)\.mustache$/);
          if (match) {
            const name = match[1];
            if (name === 'codegen') {
              // Main templates
              mainTemplates.push({
                dir: relativeDir,
                content: fs.readFileSync(fullPath, 'utf8'),
              });
            } else {
              match = name.match(/^(.*)\.versioned$/);
              if (match) {
                // Config template ends with .versioned.mustache
                versionedTemplates.push({
                  content: fs.readFileSync(fullPath, 'utf8'),
                  dir: relativeDir,
                  file: match[1],
                });
              } else {
                // Partial templates
                partialTemplates[relativeDir + name] = fs.readFileSync(
                  fullPath,
                  'utf8',
                );
              }
            }
          } else {
            filesNeedCopy.push({
              dir: relativeDir,
              file: file,
            });
          }
        }
      });
    };
    walkTemplateDir(templateDir);
    return {
      mainTemplates: mainTemplates,
      partialTemplates: partialTemplates,
      versionedTemplates: versionedTemplates,
      filesNeedCopy: filesNeedCopy,
    };
  },
  /**
   * @param {string} dir
   */
  mkdirsSync(dir) {
    let dirPath = '';
    const dirs = dir.split(path.sep);
    while (dirs.length > 0) {
      dirPath = dirPath + path.sep + dirs.shift();
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
    }
  },
  /**
   * @param {any} mainTemplates
   * @param {any} partialTemplates
   * @param {any} clsSpec
   * @param {string} language
   * @param {{ [x: string]: any; }} codeGenLanguages
   * @param {string} rootPath
   */
  fillMainTemplates(
    mainTemplates,
    partialTemplates,
    clsSpec,
    language,
    codeGenLanguages,
    rootPath,
  ) {
    mainTemplates = this.preProcessMainTemplates(mainTemplates, clsSpec);
    mainTemplates.forEach(
      /**
       * @param {{ content: string; dir?: any; }} template
       */
      template => {
        const languageDef = codeGenLanguages[language];
        let filenameToCodeMap = {};

        if (languageDef.generateFilenameToCodeMap) {
          filenameToCodeMap = languageDef.generateFilenameToCodeMap(
            clsSpec,
            template,
            partialTemplates,
          );
        } else {
          filenameToCodeMap = this.generateSimpleFilenameToCodeMap(
            clsSpec,
            template,
            partialTemplates,
            languageDef,
          );
        }

        for (const filename in filenameToCodeMap) {
          const code = filenameToCodeMap[filename];
          const outputPath = path.join(rootPath, template.dir);
          this.mkdirsSync(outputPath);
          fs.writeFileSync(path.join(outputPath, filename), code);
        }
      },
    );
  },
  /**
   * @param {any} clsSpec
   * @param {{ content: string; }} template
   * @param {any} partialTemplates
   * @param {{ formatFileName: (arg0: any, arg1: any) => void; postProcess: (arg0: string) => string; }} languageDef
   */
  generateSimpleFilenameToCodeMap(
    clsSpec,
    template,
    partialTemplates,
    languageDef,
  ) {
    const filenameToCodeMap = {};
    const filename = languageDef.formatFileName(clsSpec, template);
    let code = mustache.render(template.content, clsSpec, partialTemplates);

    if (languageDef.postProcess) {
      code = languageDef.postProcess(code);
    }

    if (code && code.length > 0) {
      filenameToCodeMap[filename] = code;
    }

    return filenameToCodeMap;
  },
  /**
   * @param {{ map: (arg0: (template: any) => any) => void; }} mainTemplates
   * @param {{ [x: string]: any; }} clsSpec
   */
  preProcessMainTemplates(mainTemplates, clsSpec) {
    return mainTemplates.map(template => {
      const newTemplate = JSON.parse(JSON.stringify(template));
      newTemplate.content = newTemplate.content.replace(
        /{{\s*>.*(%([a-zA-Z:_]+)%).*}}/gi,
        /**
         * @param {string} m
         * @param {string} p1
         * @param {string} p2
         */
        (m, p1, p2) => m.replace(p1, clsSpec[p2]),
      );
      return newTemplate;
    });
  },
  /**
   * @param {string} dir
   */
  removeRecursiveSync(dir) {
    let stats;
    try {
      stats = fs.lstatSync(dir);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      return;
    }

    if (stats.isDirectory()) {
      fs.readdirSync(dir).forEach(file =>
        Utils.removeRecursiveSync(path.join(dir, file)),
      );
      fs.rmdirSync(dir);
    } else {
      fs.unlinkSync(dir);
    }
  },
  /**
   * @param {string} srcDir
   * @param {string} destDir
   */
  copyRecursiveSync(srcDir, destDir) {
    const srcDirStats = fs.statSync(srcDir);
    if (srcDirStats.isDirectory()) {
      try {
        fs.mkdirSync(destDir);
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e;
        }
      }
      fs.readdirSync(srcDir).forEach(file =>
        Utils.copyRecursiveSync(
          path.join(srcDir, file),
          path.join(destDir, file),
        ),
      );
    } else {
      try {
        fs_extra.copySync(srcDir, destDir);
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e;
        }
      }
    }
  },
};

module.exports = Utils;
