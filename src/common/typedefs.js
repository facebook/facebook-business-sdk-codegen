/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

/**
 * @typedef {Object} Processor A 'Processor' type for processing
 * @property {{(specs: any, metadata: any) : any}} process
 */

/**
 * @typedef {Object} Loader
 * @property {{(version: string) : {specs: APIInputSpecs, metadata: APIInputMetadata}}} load
 */

/**
 * @typedef {Object} Renderer
 * @property {{(specs: { [x: string]: any; }, language: string, version: string, outputDir: string, cleandir: Array<string>) : void}} render
 */

/**
 * @typedef {Object} APIInputMetadata
 * @property {string} version
 * @property {string} [language]
 * @property {string} [outputDir]
 * @property {string[]} [cleandir]
 * @property {any} mergedOverriding
 * @property {any} versionedFeatures
 * @property {any} versionedFeaturesWithDepreciation
 */

/**
 * @typedef {Object} APIInputSpecs
 * @property {any} api_specs
 * @property {any} enumMetadataMap
 */

'use strict';

module.exports = {};
