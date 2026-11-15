import { mkdir, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
const root=process.cwd(), publicDir=resolve(root,'public');
await mkdir(publicDir,{recursive:true});
for(const file of ['manifest.json','sw.js','icon-192.png','icon-512.png','couturepro-logo.svg']){
 const source=resolve(root,file);
 try{await access(source,constants.R_OK);await copyFile(source,resolve(publicDir,file));console.log(`Asset préparé : ${file}`);}
 catch{if(file==='manifest.json')throw new Error('manifest.json absent de la racine.');console.log(`Asset facultatif absent : ${file}`);}
}
