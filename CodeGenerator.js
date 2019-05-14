/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const minimist = require('minimist')
const fs = require('fs');
var path = require('path');
const Utils = require('./common/Utils');
const Procedure = require('./common/Procedure');

const SpecFileLoader = require('./loaders/SpecFileLoader');

const AutoAddIdFieldForRootNodeProcessor =
  require('./processors/AutoAddIdFieldForRootNodeProcessor');
const ReferenceProcessor = require('./processors/ReferenceProcessor');
const NormalizationProcessor = require('./processors/NormalizationProcessor');
const SpecOverridingProcessor = require('./processors/SpecOverridingProcessor');
const NodeEndpointHackProcessor = require('./processors/NodeEndpointHackProcessor');
const NamingConventionProcessor = require('./processors/NamingConventionProcessor');
const CreationEndpointHackProcessor = require('./processors/CreationEndpointHackProcessor');
const LanguageSpecificProcessor = require('./processors/LanguageSpecificProcessor');
const FlaggingProcessor = require('./processors/FlaggingProcessor');

const MustacheRenderer = require('./renderers/MustacheRenderer');
const DebugJsonRenderer = require('./renderers/DebugJsonRenderer');
const args = minimist(process.argv.slice(2));

const language = args._[0];
Utils.validateLanguage(language);
const version = args.v || Utils.loadDefaultVersion();
const outputDir = args.o || "sdk/servers/"+language+"/release";
const cleandir = args.c ? args.c.split(',') : [];

var procedure = new Procedure({
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
    LanguageSpecificProcessor
  ],
  renderers: [
    MustacheRenderer,
    DebugJsonRenderer
  ]
});

procedure.run(version, language, outputDir, cleandir);
