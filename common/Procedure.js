/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

function Procedure(config) {
  this.loader = config.loader;
  this.processors = config.processors;
  this.renderers = config.renderers;
}

Procedure.prototype.process = function(specs, metadata) {
  for (var i in this.processors) {
    specs = this.processors[i].process(specs, metadata);
  }
  return specs;
};

Procedure.prototype.render = function(specs, metadata) {
  for (var i in this.renderers) {
    this.renderers[i].render(
      {
        APISpecs: specs.api_specs,
        SDKConfig: {
          api_version: metadata.version,
          api_version_num_only: metadata.version.replace('v', ''),
          version: metadata.versionedFeaturesWithDepreciation,
        },
      },
      metadata.language,
      metadata.version,
      metadata.outputDir,
      metadata.cleandir,
    );
  }
};

Procedure.prototype.processAndRender = function(
  version,
  language,
  outputDir,
  inputs,
  cleandir,
) {
  var specs = inputs.specs;
  var metadata = inputs.metadata;
  metadata.language = language;
  metadata.version = version;
  metadata.outputDir = outputDir;
  metadata.cleandir = cleandir;
  specs = this.process(specs, metadata);
  this.render(specs, metadata);
};

Procedure.prototype.run = function(version, language, outputDir, cleandir) {
  var self = this;
  if (self.loader.isAsync) {
    var inputs = self.loader.load(version, function(inputs) {
      self.processAndRender(version, language, outputDir, inputs, cleandir);
    });
  } else {
    var inputs = self.loader.load(version);
    self.processAndRender(version, language, outputDir, inputs, cleandir);
  }
};

module.exports = Procedure;
