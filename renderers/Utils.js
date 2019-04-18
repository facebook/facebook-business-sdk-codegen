/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

var fs = require('fs');
var fs_extra = require('fs-extra');
var path = require('path');
var mustache = require('mustache');

var Utils = {
  loadTemplates: function(templateDir) {
    // 1. load codegen main templates
    // 2. load codegen partial templates
    // 3. discover files need to copy to the sdk folder
    var mainTemplates = [];
    var partialTemplates = {};
    var versionedTemplates = [];
    var filesNeedCopy = [];
    function walkTemplateDir(dir) {
      var relativeDir = dir.substring(templateDir.length) + path.sep;
      fs.readdirSync(dir).forEach(function(file) {
        var fullPath = path.join(dir, file);
        var relativePath = path.join(relativeDir, file);

        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkTemplateDir(fullPath);
        } else if (stat.isFile()) {
          var match = file.match(/^(.*)\.mustache$/);
          if (match) {
            var name = match[1];
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
                partialTemplates[relativeDir + name]
                  = fs.readFileSync(fullPath, 'utf8');
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
    }
    walkTemplateDir(templateDir);
    return {
      mainTemplates: mainTemplates,
      partialTemplates: partialTemplates,
      versionedTemplates: versionedTemplates,
      filesNeedCopy: filesNeedCopy
    };
  },
  mkdirsSync: function(dir) {
    var dirPath = '';
    var dirs = dir.split(path.sep);
    while (dirs.length > 0) {
      dirPath = dirPath + path.sep + dirs.shift();
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
    }
  },
  fillMainTemplates: function(mainTemplates, partialTemplates, clsSpec,
    language, codeGenLanguages, rootPath) {
    var self = this;

    mainTemplates = self.preProcessMainTemplates(mainTemplates, clsSpec);
    mainTemplates.forEach(function(template) {
      var languageDef = codeGenLanguages[language];
      var filenameToCodeMap = {}

      if (languageDef.generateFilenameToCodeMap) {
        filenameToCodeMap = languageDef.generateFilenameToCodeMap(
          clsSpec, template, partialTemplates);
      } else {
        filenameToCodeMap = self.generateSimpleFilenameToCodeMap(
          clsSpec, template, partialTemplates, languageDef);
      }

      for (var filename in filenameToCodeMap) {
        var code = filenameToCodeMap[filename];
        var outputPath = path.join(rootPath, template.dir);
        self.mkdirsSync(outputPath);
        fs.writeFileSync(path.join(outputPath, filename), code);
      }
    });
  },
  generateSimpleFilenameToCodeMap: function(clsSpec, template, partialTemplates,
    languageDef) {
    var filenameToCodeMap = {}
    var filename = languageDef.formatFileName(clsSpec, template);
    var code = mustache.render(template.content, clsSpec, partialTemplates);

    if (languageDef.postProcess) {
      code = languageDef.postProcess(code);
    }

    if (code && code.length > 0) {
      filenameToCodeMap[filename] = code;
    }

    return filenameToCodeMap;
  },
  preProcessMainTemplates: function(mainTemplates, clsSpec) {
    var self = this;
    return mainTemplates.map(function(template) {
      var newTemplate = JSON.parse(JSON.stringify(template));
        newTemplate.content = newTemplate.content.replace(
        /{{\s*>.*(%([a-zA-Z:_]+)%).*}}/ig,
        function(m, p1, p2) {
          return m.replace(p1, clsSpec[p2]);
        }
      );
      return newTemplate;
    });
  },
  removeRecursiveSync: function(dir) {
    var stats;
    try {
      stats = fs.lstatSync(dir);
    } catch(e) {
      if (e.code !== 'ENOENT') throw e;
      return;
    }

    if (stats.isDirectory()) {
      fs.readdirSync(dir).forEach(function(file) {
        Utils.removeRecursiveSync(path.join(dir, file));
      });
      fs.rmdirSync(dir);
    } else {
      fs.unlinkSync(dir);
    }
  },
  copyRecursiveSync: function(srcDir, destDir) {
    var srcDirStats = fs.statSync(srcDir);
    if (srcDirStats.isDirectory()) {
      try {
        fs.mkdirSync(destDir);
      } catch(e) {
        if (e.code !== 'EEXIST') throw e;
      }
      fs.readdirSync(srcDir).forEach(function(file) {
        Utils.copyRecursiveSync(
          path.join(srcDir, file),
          path.join(destDir, file)
        );
      });
    } else {
      try {
        fs_extra.copySync(srcDir, destDir);
      } catch(e) {
        if (e.code !== 'EEXIST') throw e;
      }
    }
  }
}

module.exports = Utils;
