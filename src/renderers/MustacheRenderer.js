/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow
 */

'use strict';

// $FlowFixMe
import fs_extra from 'fs-extra';
import mustache from 'mustache';
import path from 'path';

import codeGenLanguages from '../processors/CodeGenLanguages';
import utils from './Utils';
import commonUtils from '../common/Utils';

import type {Renderer} from '../common/types';

const MustacheRenderer: Renderer = {
  render(specs, language, version, outputDir, cleandir) {
    const APISpecs = specs.APISpecs;
    const SDKConfig = specs.SDKConfig;

    const codegenRootDir = path.resolve(__dirname, '..', '..');
    const templateDir = path.resolve(codegenRootDir, 'templates', language);
    const sdkRootPath = path.resolve(outputDir);

    // load the mustache templates
    const loadedTemplates = utils.loadTemplates(templateDir);
    const mainTemplates = loadedTemplates.mainTemplates;
    const partialTemplates = loadedTemplates.partialTemplates;
    const versionedTemplates = loadedTemplates.versionedTemplates;
    const filesNeedCopy = loadedTemplates.filesNeedCopy;

    // clean up the folder
    if (
      cleandir === undefined ||
      cleandir.length == 0 ||
      !fs_extra.existsSync(sdkRootPath)
    ) {
      utils.removeRecursiveSync(sdkRootPath, language);
      utils.mkdirsSync(sdkRootPath);
    } else {
      for (const d of cleandir) {
        const tmp = path.resolve(sdkRootPath, d);
        console.log(tmp);
        utils.removeRecursiveSync(tmp, language);
        utils.mkdirsSync(tmp);
      }
    }

    // Copy the common folder
    console.log('Generating ' + language + ' SDK in ' + outputDir + '...');

    // @fb-only
    // @fb-only

    // Generate code with mustache templates
    for (const nodeName in APISpecs) {
      const APIClsSpec = APISpecs[nodeName];
      utils.fillMainTemplates(
        mainTemplates,
        partialTemplates,
        APIClsSpec,
        language,
        codeGenLanguages,
        sdkRootPath,
      );
    }

    const depreciationSign = commonUtils.codeGenFileDepreciationSign;
    const apiSpecArray = [];
    for (const nodeName in APISpecs) {
      const APIClsSpec = APISpecs[nodeName];
      apiSpecArray.push(APIClsSpec);
    }
    SDKConfig.api_specs = apiSpecArray;
    versionedTemplates.forEach(value => {
      const fileContent = mustache.render(value.content, SDKConfig, {});
      if (fileContent.trim().indexOf(depreciationSign + '\n')) {
        const destDir = sdkRootPath + value.dir;
        utils.mkdirsSync(destDir);
        fs_extra.writeFileSync(destDir + value.file, fileContent);
      }
    });

    // Copy static files
    filesNeedCopy.forEach(value => {
      const destDir = sdkRootPath + value.dir;
      utils.mkdirsSync(destDir);

      fs_extra.copy(templateDir + value.dir + value.file, destDir + value.file);
    });
    console.log(language + ' SDK generated in ' + outputDir);
  },
};

export default MustacheRenderer;
