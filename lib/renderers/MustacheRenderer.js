/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * 
 */

'use strict';

// $FlowFixMe

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _CodeGenLanguages = require('../processors/CodeGenLanguages');

var _CodeGenLanguages2 = _interopRequireDefault(_CodeGenLanguages);

var _Utils = require('./Utils');

var _Utils2 = _interopRequireDefault(_Utils);

var _Utils3 = require('../common/Utils');

var _Utils4 = _interopRequireDefault(_Utils3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MustacheRenderer = {
  render(specs, language, version, outputDir, cleandir) {
    const APISpecs = specs.APISpecs;
    const SDKConfig = specs.SDKConfig;

    const codegenRootDir = _path2.default.resolve(__dirname, '..', '..');
    const templateDir = _path2.default.resolve(codegenRootDir, 'templates', language);
    const sdkRootPath = _path2.default.resolve(outputDir);

    // load the mustache templates
    const loadedTemplates = _Utils2.default.loadTemplates(templateDir);
    const mainTemplates = loadedTemplates.mainTemplates;
    const partialTemplates = loadedTemplates.partialTemplates;
    const versionedTemplates = loadedTemplates.versionedTemplates;
    const filesNeedCopy = loadedTemplates.filesNeedCopy;

    // clean up the folder
    if (cleandir === undefined || cleandir.length == 0 || !_fsExtra2.default.existsSync(sdkRootPath)) {
      _Utils2.default.removeRecursiveSync(sdkRootPath, language);
      _Utils2.default.mkdirsSync(sdkRootPath);
    } else {
      for (const d of cleandir) {
        const tmp = _path2.default.resolve(sdkRootPath, d);
        console.log(tmp);
        _Utils2.default.removeRecursiveSync(tmp, language);
        _Utils2.default.mkdirsSync(tmp);
      }
    }

    // Copy the common folder
    console.log('Generating ' + language + ' SDK in ' + outputDir + '...');

    // @fb-only
    // @fb-only

    // Generate code with mustache templates
    for (const nodeName in APISpecs) {
      const APIClsSpec = APISpecs[nodeName];
      _Utils2.default.fillMainTemplates(mainTemplates, partialTemplates, APIClsSpec, language, _CodeGenLanguages2.default, sdkRootPath);
    }

    const depreciationSign = _Utils4.default.codeGenFileDepreciationSign;
    const apiSpecArray = [];
    for (const nodeName in APISpecs) {
      const APIClsSpec = APISpecs[nodeName];
      apiSpecArray.push(APIClsSpec);
    }
    SDKConfig.api_specs = apiSpecArray;
    versionedTemplates.forEach(value => {
      const fileContent = _mustache2.default.render(value.content, SDKConfig, {});
      if (fileContent.trim().indexOf(depreciationSign + '\n')) {
        const destDir = sdkRootPath + value.dir;
        _Utils2.default.mkdirsSync(destDir);
        _fsExtra2.default.writeFileSync(destDir + value.file, fileContent);
      }
    });

    // Copy static files
    filesNeedCopy.forEach(value => {
      const destDir = sdkRootPath + value.dir;
      _Utils2.default.mkdirsSync(destDir);

      _fsExtra2.default.copy(templateDir + value.dir + value.file, destDir + value.file);
    });
    console.log(language + ' SDK generated in ' + outputDir);
  }
};

exports.default = MustacheRenderer;
