/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

const codeGenLanguages = require('./CodeGenLanguages');
const codeGenNameConventions = require('./CodeGenNameConventions');

/*
 * This processor performs language specific transformations for the specs, as
 * defined in codeGenLanguages.
 */
var processor = {
  process: function(specs, metadata) {
    var language = metadata.language;
    var languageDef = codeGenLanguages[language];
    var APISpecs = specs.api_specs;
    var enumMetadataMap = specs.enumMetadataMap;

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

module.exports = processor;
