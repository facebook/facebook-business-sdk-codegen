/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

'use strict';

const minimist = require('minimist');

const Procedure = require('./common/Procedure');
const Utils = require('./common/Utils');
const SpecFileLoader = require('./loaders/SpecFileLoader');
const AutoAddIdFieldForRootNodeProcessor = require('./processors/AutoAddIdFieldForRootNodeProcessor');
const CreationEndpointHackProcessor = require('./processors/CreationEndpointHackProcessor');
const FlaggingProcessor = require('./processors/FlaggingProcessor');
const LanguageSpecificProcessor = require('./processors/LanguageSpecificProcessor');
const NamingConventionProcessor = require('./processors/NamingConventionProcessor');
const NodeEndpointHackProcessor = require('./processors/NodeEndpointHackProcessor');
const NormalizationProcessor = require('./processors/NormalizationProcessor');
const ReferenceProcessor = require('./processors/ReferenceProcessor');
const SpecOverridingProcessor = require('./processors/SpecOverridingProcessor');
const DebugJsonRenderer = require('./renderers/DebugJsonRenderer');
const MustacheRenderer = require('./renderers/MustacheRenderer');

const procedure = new Procedure({
  loader: SpecFileLoader,
  processors: [
    SpecOverridingProcessor,
    AutoAddIdFieldForRootNodeProcessor,
    NodeEndpointHackProcessor,
    NormalizationProcessor,
    FlaggingProcessor,
    CreationEndpointHackProcessor,
    NamingConventionProcessor,
    ReferenceProcessor,
    LanguageSpecificProcessor,
  ],
  renderers: [MustacheRenderer, DebugJsonRenderer],
});

const args = minimist(process.argv.slice(2));

const language = args._[0];
Utils.validateLanguage(language);

/** @type {string} */
const version = args.v || Utils.loadDefaultVersion();

/** @type {string} */
const outputDir = args.o || 'sdk/servers/' + language + '/release';

/** @type {string[]} */
const cleandir = args.c ? args.c.split(',') : [];

procedure.run(version, language, outputDir, cleandir);
