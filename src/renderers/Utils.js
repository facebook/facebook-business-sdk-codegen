/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

'use strict';

import fs from 'fs';
import fs_extra from 'fs-extra';
import path from 'path';
import mustache from 'mustache';
import versionPath from '../../api_specs/version_path.json';

const PATH_SKIP_AUTOGEN = [
    /^(.*)\/[sS]erver[_]?[sS]ide\/(.*)$/,
    /^(.*)\/\.travis.yml$/,
    /^(.*)\/\.github\/workflows\/(.*).yml$/,
    /^(.*)\/\keyring.gpg.enc$/,
    /^(.*)\/\.travis.settings.xml$/,
    /^(.*)\/facebook_business\/test\/(.*)$/,
    /^(.*)\/CHANGELOG.md$/,
    /^(.*)\/[bB]usiness[dD]ata[aA][pP][iI]\/(.*)$/,
    /^(.*)\/[sS]ignal\/(.*)$/,
    /^(.*)\/README.md$/,
    /^(.*)\/release.sh$/,
    /^(.*)\/\.flowconfig$/,
];
const Utils = {
    loadTemplates(templateDir: string) {
        // 1. load codegen main templates
        // 2. load codegen partial templates
        // 3. discover files need to copy to the sdk folder
        const mainTemplates = [];
        const partialTemplates = {};
        const versionedTemplates = [];
        const filesNeedCopy = [];

        const walkTemplateDir = (dir: string) => {
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

    mkdirsSync(dir: string) {
        let dirPath = '';
        const dirs = dir.split(path.sep);
        while (dirs.length > 0) {
            dirPath = dirPath + path.sep + dirs.shift();
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }
        }
    },

    fillMainTemplates(
        mainTemplates: any,
        partialTemplates: any,
        clsSpec: any,
        language: string,
        codeGenLanguages: {
            [key: string]: any
        },
        rootPath: string,
    ) {
        mainTemplates = this.preProcessMainTemplates(mainTemplates, clsSpec);
        mainTemplates.forEach((template: { content: string, dir: string }) => {
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
        });
    },

    generateSimpleFilenameToCodeMap(
        clsSpec: string,
        template: { content: string },
        partialTemplates: any,
        languageDef: {
            formatFileName: (arg0: any, arg1: any) => string,
            postProcess: (arg0: string) => string,
        },
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

    preProcessMainTemplates(
        mainTemplates: { map: (arg0: (template: any) => any) => any },
        clsSpec: {
            [string]: any
        },
    ) {
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

    removeRecursiveSync(dir: string, language: string) {
        for (var i = 0, len = PATH_SKIP_AUTOGEN.length; i < len; i++) {
            let match = dir.match(PATH_SKIP_AUTOGEN[i]);
            if (match) {
                return false;
            }
        }

        let version_file = versionPath[language]['base_path'] + '/' + versionPath[language]['file_path'];
        let match = dir.includes(version_file);
        if (match) {
            return false;
        }

        let stats;
        try {
            stats = fs.lstatSync(dir);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e;
            }
            return false;
        }

        if (stats.isDirectory()) {
            let delete_all = true;
            fs.readdirSync(dir).forEach(file =>
                delete_all &= Utils.removeRecursiveSync(path.join(dir, file), language),
            );
            if (delete_all) {
                fs.rmdirSync(dir);
            } else {
                return false;
            }

        } else {
            fs.unlinkSync(dir);
        }
        return true;
    },

    copyRecursiveSync(srcDir: string, destDir: string) {
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