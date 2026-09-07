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

var _types = require('./types');

class Procedure {

  constructor(props) {
    this.loader = props.loader;
    this.processors = props.processors;
    this.renderers = props.renderers;
  }

  run(version, sdk_version, language, outputDir, cleandir) {
    const inputs = this.loader.load(version, sdk_version);

    const metadata = inputs.metadata;
    metadata.language = language;
    metadata.version = version;
    metadata.sdk_version = sdk_version;
    metadata.outputDir = outputDir;
    metadata.cleandir = cleandir;

    let specs = inputs.specs;
    this.processors.forEach(processor => {
      specs = processor.process(specs, metadata);
    });

    this.renderers.forEach(renderer => {
      renderer.render({
        APISpecs: specs.api_specs,
        SDKConfig: {
          api_version: metadata.version,
          sdk_version: metadata.sdk_version,
          api_version_num_only: metadata.version.replace('v', ''),
          version: metadata.versionedFeaturesWithDepreciation
        }
      }, metadata.language || '', metadata.version, metadata.outputDir || '', metadata.cleandir || []);
    });
  }
}

exports.default = Procedure;