// Builds library.json for the Cheklst app from the Markdown in this repository.
// No dependencies (Node 20+). Usage: node .cheklst/build.mjs [output.json]
//
//   Category folder / checklist.md   →  one checklist in that category
//   "1. Travel/"  or  "02 Packing.md" →  the number sets the order and is hidden
//   First "# Heading" in a file       →  its title (otherwise the file name)
//
// Root-level files, README.md files and dot-folders are ignored. A checklist's identity is
// its path, so renaming or moving a file makes it a new checklist in the app.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

const root=path.resolve(process.argv[3]||path.join(import.meta.dirname,'..'));
const output=path.resolve(process.argv[2]||path.join(root,'library.json'));
const ORDER=/^(\d+)[.\-_ )]+\s*/;
const sha=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,16);
const strip=name=>name.replace(ORDER,'').trim();
const order=name=>{const m=name.match(ORDER);return m?Number(m[1]):null;};
const byOrder=(a,b)=>(order(a)??1e9)-(order(b)??1e9)||strip(a).localeCompare(strip(b));

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).filter(d=>!d.name.startsWith('.')).flatMap(d=>{
    const full=path.join(dir,d.name);
    if(d.isDirectory())return walk(full);
    return d.isFile()&&/\.md$/i.test(d.name)&&d.name.toLowerCase()!=='readme.md'?[full]:[];
  });
}

const errors=[],checklists=[];
const folders=fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.name.startsWith('.')).map(d=>d.name).sort(byOrder);
const categories=[];
for(const folder of folders){
  const category=strip(folder);
  if(!category||category.length>60){errors.push(`${folder}: category folder names must be 1–60 characters.`);continue;}
  if(categories.some(c=>c.toLowerCase()===category.toLowerCase())){errors.push(`${folder}: two folders make the category “${category}”.`);continue;}
  const files=walk(path.join(root,folder)).sort((a,b)=>byOrder(path.basename(a),path.basename(b)));
  if(!files.length)continue;
  categories.push(category);
  for(const file of files){
    const rel=path.relative(root,file).split(path.sep).join('/');
    const markdown=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
    const base=path.basename(file).replace(/\.md$/i,'');
    const heading=markdown.match(/^#\s+(.+)$/m)?.[1].trim();
    const title=heading||strip(base)||base;
    if(!markdown.trim()){errors.push(`${rel}: file is empty.`);continue;}
    if(markdown.length>1_000_000){errors.push(`${rel}: file is over 1 MB.`);continue;}
    if(/```calc/.test(markdown)&&(markdown.match(/^```/gm)||[]).length%2)errors.push(`${rel}: a \`\`\`calc block is not closed with \`\`\`.`);
    checklists.push({id:'lib-'+sha(rel),path:rel,title,category,sequence:order(path.basename(file)),markdown,hash:sha(markdown)});
  }
}
if(errors.length){console.error('Library not published:\n- '+errors.join('\n- '));process.exit(1);}
const pkg={format:'cheklst-library-v1',categories,checklists};
if(process.env.GITHUB_SHA)pkg.source_commit=process.env.GITHUB_SHA;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(pkg,null,2)+'\n');
console.log(`Built ${checklists.length} checklists in ${categories.length} categories → ${output}`);
