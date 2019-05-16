/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

const merge = require('merge');
const JSONPath = require('jsonpath-plus');
const path = require('path');
const pluralize = require('pluralize');

const codeGenNameConventions = require('./CodeGenNameConventions');
const codeGenUtil = require('./CodeGenUtil');

/*
 * This processor add id field to fields if the class contains apis, which
 * means it is a root node. This processor need to run earlier in the pipeline
 */
const AutoAddIdFieldForRootNodeProcessor = {};
AutoAddIdFieldForRootNodeProcessor.process = function(specs, metadata) {
  var APISpecs = specs.api_specs;
  for (var clsName in APISpecs) {
    var APIClsSpec = APISpecs[clsName];
    var hasIdField = false;
    for (var index in APIClsSpec['fields']) {
      var fieldSpec = APIClsSpec['fields'][index];
      if (fieldSpec['name'] === 'id') {
        hasIdField = true;
        break;
      }
    }
    if (!hasIdField && APIClsSpec['apis'] && APIClsSpec['apis'].length > 0) {
      APIClsSpec['fields'].push({
        name: 'id',
        type: 'string',
      });
    }
  }

  return specs;
};

const getReferenceType = function(type, APISpecs) {
  if (type) {
    referenceType = codeGenUtil.getBaseType(type);
    if (referenceType in APISpecs) {
      return referenceType;
    }
  }
};

module.exports = AutoAddIdFieldForRootNodeProcessor;
