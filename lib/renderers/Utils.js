/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

var _version_path = require('../../api_specs/version_path.json');

var _version_path2 = _interopRequireDefault(_version_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PATH_SKIP_AUTOGEN = [/^(.*)\/[sS]erver[_]?[sS]ide\/(.*)$/, /^(.*)\/\.travis.yml$/, /^(.*)\/\.github\/workflows\/(.*).yml$/, /^(.*)\/\keyring.gpg.enc$/, /^(.*)\/\.travis.settings.xml$/, /^(.*)\/facebook_business\/test\/(.*)$/, /^(.*)\/CHANGELOG.md$/, /^(.*)\/[bB]usiness[dD]ata[aA][pP][iI]\/(.*)$/, /^(.*)\/[sS]ignal\/(.*)$/, /^(.*)\/README.md$/, /^(.*)\/release.sh$/, /^(.*)\/\.flowconfig$/, /^(.*)\/facebookbusiness.gemspec$/, /^(.*)\/Gemfile(.*)$/, /^(.*)\/Rakefile$/, /^(.*)\/facebookbusiness.gemspec$/, /^(.*)\/customtype$/];
const Utils = {
    loadTemplates(templateDir) {
        // 1. load codegen main templates
        // 2. load codegen partial templates
        // 3. discover files need to copy to the sdk folder
        const mainTemplates = [];
        const partialTemplates = {};
        const versionedTemplates = [];
        const filesNeedCopy = [];

        const walkTemplateDir = dir => {
            const relativeDir = dir.substring(templateDir.length) + _path2.default.sep;
            _fs2.default.readdirSync(dir).forEach(file => {
                const fullPath = _path2.default.join(dir, file);

                const stat = _fs2.default.statSync(fullPath);
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
                                content: _fs2.default.readFileSync(fullPath, 'utf8')
                            });
                        } else {
                            match = name.match(/^(.*)\.versioned$/);
                            if (match) {
                                // Config template ends with .versioned.mustache
                                versionedTemplates.push({
                                    content: _fs2.default.readFileSync(fullPath, 'utf8'),
                                    dir: relativeDir,
                                    file: match[1]
                                });
                            } else {
                                // Partial templates
                                partialTemplates[relativeDir + name] = _fs2.default.readFileSync(fullPath, 'utf8');
                            }
                        }
                    } else {
                        filesNeedCopy.push({
                            dir: relativeDir,
                            file: file
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
            filesNeedCopy: filesNeedCopy
        };
    },

    mkdirsSync(dir) {
        let dirPath = '';
        const dirs = dir.split(_path2.default.sep);
        while (dirs.length > 0) {
            dirPath = dirPath + _path2.default.sep + dirs.shift();
            if (!_fs2.default.existsSync(dirPath)) {
                _fs2.default.mkdirSync(dirPath);
            }
        }
    },

    fillMainTemplates(mainTemplates, partialTemplates, clsSpec, language, codeGenLanguages, rootPath) {
        mainTemplates = this.preProcessMainTemplates(mainTemplates, clsSpec);
        mainTemplates.forEach(template => {
            const languageDef = codeGenLanguages[language];
            let filenameToCodeMap = {};

            if (languageDef.generateFilenameToCodeMap) {
                filenameToCodeMap = languageDef.generateFilenameToCodeMap(clsSpec, template, partialTemplates);
            } else {
                filenameToCodeMap = this.generateSimpleFilenameToCodeMap(clsSpec, template, partialTemplates, languageDef);
            }

            for (const filename in filenameToCodeMap) {
                const code = filenameToCodeMap[filename];
                const outputPath = _path2.default.join(rootPath, template.dir);
                this.mkdirsSync(outputPath);
                _fs2.default.writeFileSync(_path2.default.join(outputPath, filename), code);
            }
        });
    },

    generateSimpleFilenameToCodeMap(clsSpec, template, partialTemplates, languageDef) {
        const filenameToCodeMap = {};
        const filename = languageDef.formatFileName(clsSpec, template);
        let code = _mustache2.default.render(template.content, clsSpec, partialTemplates);

        if (languageDef.postProcess) {
            code = languageDef.postProcess(code);
        }

        if (code && code.length > 0) {
            filenameToCodeMap[filename] = code;
        }

        return filenameToCodeMap;
    },

    preProcessMainTemplates(mainTemplates, clsSpec) {
        return mainTemplates.map(template => {
            const newTemplate = JSON.parse(JSON.stringify(template));
            newTemplate.content = newTemplate.content.replace(/{{\s*>.*(%([a-zA-Z:_]+)%).*}}/gi,
            /**
             * @param {string} m
             * @param {string} p1
             * @param {string} p2
             */
            (m, p1, p2) => m.replace(p1, clsSpec[p2]));
            return newTemplate;
        });
    },

    removeRecursiveSync(dir, language) {
        for (var i = 0, len = PATH_SKIP_AUTOGEN.length; i < len; i++) {
            let match = dir.match(PATH_SKIP_AUTOGEN[i]);
            if (match) {
                return false;
            }
        }

        let version_file = _version_path2.default[language]['base_path'] + '/' + _version_path2.default[language]['file_path'];
        let match = dir.includes(version_file);
        if (match) {
            return false;
        }

        let stats;
        try {
            stats = _fs2.default.lstatSync(dir);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e;
            }
            return false;
        }

        if (stats.isDirectory()) {
            let delete_all = true;
            _fs2.default.readdirSync(dir).forEach(file => delete_all &= Utils.removeRecursiveSync(_path2.default.join(dir, file), language));
            if (delete_all) {
                _fs2.default.rmdirSync(dir);
            } else {
                return false;
            }
        } else {
            _fs2.default.unlinkSync(dir);
        }
        return true;
    },

    copyRecursiveSync(srcDir, destDir) {
        const srcDirStats = _fs2.default.statSync(srcDir);
        if (srcDirStats.isDirectory()) {
            try {
                _fs2.default.mkdirSync(destDir);
            } catch (e) {
                if (e.code !== 'EEXIST') {
                    throw e;
                }
            }
            _fs2.default.readdirSync(srcDir).forEach(file => Utils.copyRecursiveSync(_path2.default.join(srcDir, file), _path2.default.join(destDir, file)));
        } else {
            try {
                _fsExtra2.default.copySync(srcDir, destDir);
            } catch (e) {
                if (e.code !== 'EEXIST') {
                    throw e;
                }
            }
        }
    }
};

module.exports = Utils;
