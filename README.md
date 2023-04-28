# Facebook Business SDK Codegen

## Introduction

This project contains all the code to auto generate Facebook Business SDKs
([php](https://github.com/facebook/facebook-php-business-sdk),
[python](https://github.com/facebook/facebook-python-business-sdk),
[nodejs](https://github.com/facebook/facebook-nodejs-business-sdk),
[ruby](https://github.com/facebook/facebook-ruby-business-sdk),
[java](https://github.com/facebook/facebook-java-business-sdk)). There are three
parts of this project :

- JSON schema representation of the Graph API endpoints.
- [Mustache](https://mustache.github.io/) template for 5 languages.
- Codegen scripts.

## Pre-requisites

Install [Node.js](https://nodejs.org/en/)

Install all dependencies by [npm](https://www.npmjs.com/) : `npm install`

## Codegen SDK

```bash
npm run build && node lib/CodeGenerator.js <language>
```

## Debug

During debug, if you want to compare with the generated SDK to our current SDK
code, you can specific the output folder by using `-o` :

```bash
npm run build && node lib/CodeGenerator.js <language> -o outputDir
```

If you want to keep git config in `outputDir`, you can specific only cleanup
source code by using `-c` , for example:

```bash
npm run build && node lib/CodeGenerator.js php -o ../facebook-php-business-sdk/ -c src/
```

## License

Facebook Codegen for Business SDKs is licensed under the [LICENSE](https://github.com/facebook/facebook-business-sdk-codegen/blob/main/LICENSE) file in the
root directory of this source tree.
