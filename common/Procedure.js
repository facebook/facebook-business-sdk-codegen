/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

/**
 * @typedef { import("../common/typedefs").Renderer } Renderer
 * @typedef { import("../common/typedefs").Processor } Processor
 * @typedef { import("../common/typedefs").Loader } Loader
 *
 * @typedef {Object} ProcedureProps
 * @property {Loader} loader
 * @property {Array<Processor>} processors
 * @property {Array<Renderer>} renderers
 */

'use strict';

class Procedure {
  /**
   * @param {ProcedureProps} props
   */
  constructor(props) {
    this.loader = props.loader;
    this.processors = props.processors;
    this.renderers = props.renderers;
  }
  /**
   * @param {string} version
   * @param {string} language
   * @param {string} outputDir
   * @param {string[]} cleandir
   */
  run(version, language, outputDir, cleandir) {
    const inputs = this.loader.load(version);

    const metadata = inputs.metadata;
    metadata.language = language;
    metadata.version = version;
    metadata.outputDir = outputDir;
    metadata.cleandir = cleandir;

    let specs = inputs.specs;
    for (const i in this.processors) {
      specs = this.processors[i].process(specs, metadata);
    }

    for (const i in this.renderers) {
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
  }
}

module.exports = Procedure;
