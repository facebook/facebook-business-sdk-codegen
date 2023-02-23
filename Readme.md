SDK empresarial de Facebook Codegen
Introducción
Este proyecto contiene todo el código para generar automáticamente los SDK de Facebook Business ( php , python , nodejs , ruby , java ). Hay tres partes de este proyecto:

Representación de esquema JSON de los extremos de Graph API.
Plantilla de bigote para 5 idiomas.
Guiones Codegen.
requisitos previos
Instalar Node.js

Instale todas las dependencias por npm :npm install

SDK de Codegen
npm run build && node lib/CodeGenerator.js <language>
Depurar
Durante la depuración, si desea comparar el SDK generado con nuestro código SDK actual, puede especificar la carpeta de salida mediante -o:

npm run build && node lib/CodeGenerator.js <language> -o outputDir
Si desea mantener la configuración de git outputDir, puede especificar solo el código fuente de limpieza utilizando -c, por ejemplo:

npm run build && node lib/CodeGenerator.js php -o ../facebook-php-business-sdk/ -c src/
Licencia
Los SDK de Facebook Codegen for Business tienen licencia bajo el archivo LICENSE en el directorio raíz de este árbol fuente.
