/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import codeGenLanguages from './CodeGenLanguages';
import codeGenNameConventions from './CodeGenNameConventions';

import type {Processor} from '../common/types';

/*
 * This processor performs language specific transformations for the specs, as
 * defined in codeGenLanguages.
 */
const processor: Processor = {
  process(specs, metadata) {
    const language: string = metadata.language || '';
    const languageDef = codeGenLanguages[language];
    const APISpecs = specs.api_specs;
    const enumMetadataMap = specs.enumMetadataMap;

    if (languageDef.preMustacheProcess) {
      languageDef.preMustacheProcess(
        APISpecs,
        codeGenNameConventions,
        enumMetadataMap,
      );
    }

    return specs;
  },
};

export default processor;
