# Facebook Business SDK Codegen

## Introduction
This project contains all the code to auto generate Facebook Business SDKs ([php](https://github.com/facebook/facebook-php-business-sdk), [python](https://github.com/facebook/facebook-python-business-sdk), [nodejs](https://github.com/facebook/facebook-nodejs-business-sdk), [ruby](https://github.com/facebook/facebook-ruby-business-sdk), [java](https://github.com/facebook/facebook-java-business-sdk)). There are three parts of this project :
* JSON schema representation of the Graph API endpoints.
* [Mustache](https://mustache.github.io/) template for 5 languages.
* Codegen scripts.

## Pre-requisites
Install [Node.js](https://nodejs.org/en/)

Install all dependencies by [npm](https://www.npmjs.com/) : `npm install`

## Codegen SDK
```
node CodeGenerator.js <language>
```

## License
Facebook Codegen for Business SDKs is licensed under the LICENSE file in the root directory of this source tree.
