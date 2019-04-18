/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const fs = require('fs');
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

const language = process.argv[2];
Utils.validateLanguage(language);
const version = process.argv[3] || Utils.loadDefaultVersion();
const outputDir = process.argv[4] || "sdk/servers/"+language;

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

procedure.run(version, language, outputDir);
