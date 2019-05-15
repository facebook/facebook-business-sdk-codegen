/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

const fs = require('fs-extra');
const mustache = require('mustache');
const path = require('path');

const codeGenLanguages = require('../processors/CodeGenLanguages');
const utils = require('./Utils');
const commonUtils = require('../common/Utils');

const MustacheRenderer = {};

MustacheRenderer.render = function(
  specs,
  language,
  version,
  outputDir,
  cleandir,
) {
  const APISpecs = specs['APISpecs'];
  const SDKConfig = specs['SDKConfig'];

  var codegenRootDir = path.resolve(__dirname, '..');
  var templateDir = path.resolve(codegenRootDir, 'templates', language);
  var sdkRootPath = path.resolve(outputDir);

  // load the mustache templates
  var loadedTemplates = utils.loadTemplates(templateDir);
  var mainTemplates = loadedTemplates.mainTemplates;
  var partialTemplates = loadedTemplates.partialTemplates;
  var versionedTemplates = loadedTemplates.versionedTemplates;
  var filesNeedCopy = loadedTemplates.filesNeedCopy;

  // clean up the folder
  if (
    cleandir === undefined ||
    cleandir.length == 0 ||
    !fs.existsSync(sdkRootPath)
  ) {
    utils.removeRecursiveSync(sdkRootPath);
    utils.mkdirsSync(sdkRootPath);
  } else {
    for (var d of cleandir) {
      let tmp = path.resolve(sdkRootPath, d);
      console.log(tmp);
      utils.removeRecursiveSync(tmp);
      utils.mkdirsSync(tmp);
    }
  }

  // Copy the common folder
  console.log('Generating ' + language + ' SDK in ' + outputDir + '...');

  // @fb-only
  // @fb-only

  // Generate code with mustache templates
  for (var nodeName in APISpecs) {
    var APIClsSpec = APISpecs[nodeName];
    utils.fillMainTemplates(
      mainTemplates,
      partialTemplates,
      APIClsSpec,
      language,
      codeGenLanguages,
      sdkRootPath,
    );
  }

  const codeGenFileDepreciationSign = commonUtils.getCodeGenFileDepreciationSign();
  const apiSpecArray = [];
  for (var nodeName in APISpecs) {
    var APIClsSpec = APISpecs[nodeName];
    apiSpecArray.push(APIClsSpec);
  }
  SDKConfig.api_specs = apiSpecArray;
  versionedTemplates.forEach(function(value) {
    var fileContent = mustache.render(value.content, SDKConfig, {});
    if (fileContent.trim().indexOf(codeGenFileDepreciationSign + '\n')) {
      var destDir = sdkRootPath + value.dir;
      utils.mkdirsSync(destDir);
      fs.writeFileSync(destDir + value.file, fileContent);
    }
  });

  // Copy static files
  filesNeedCopy.forEach(function(value) {
    var destDir = sdkRootPath + value.dir;
    utils.mkdirsSync(destDir);

    fs.copy(templateDir + value.dir + value.file, destDir + value.file);
  });
  console.log(language + ' SDK generated in ' + outputDir);
};

module.exports = MustacheRenderer;
