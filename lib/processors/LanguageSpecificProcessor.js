/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict-local
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _CodeGenLanguages = require('./CodeGenLanguages');

var _CodeGenLanguages2 = _interopRequireDefault(_CodeGenLanguages);

var _CodeGenNameConventions = require('./CodeGenNameConventions');

var _CodeGenNameConventions2 = _interopRequireDefault(_CodeGenNameConventions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * This processor performs language specific transformations for the specs, as
 * defined in codeGenLanguages.
 */
const processor = {
  process(specs, metadata) {
    const language = metadata.language || '';
    const languageDef = _CodeGenLanguages2.default[language];
    const APISpecs = specs.api_specs;
    const enumMetadataMap = specs.enumMetadataMap;

    if (languageDef.preMustacheProcess) {
      languageDef.preMustacheProcess(APISpecs, _CodeGenNameConventions2.default, enumMetadataMap);
    }

    return specs;
  }
};

exports.default = processor;