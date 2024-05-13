# iMake
stands for AI make, which supports to make from anything (docs, codes, outlines, templates) to anything (docs, codes).

## development
using nodejs (esm), using `commander`, `got`, `chalk`. the command for **iMake** is `imk`, which should be able to be installed global via `npm install -g` or yarn.

# functions
## simple make
type `imk` simply in the code folder triggers a rough make. this involves the following steps:

### 1. check the .gitignore & .imkignore for files & folders that should not be touched
### 2. improve designs
search for .md files. these md files defines what how this projects functions, and how each function block are related. In this step, we output improved .md files in the same folder structure as in the current directory to the `$PWD/out`. To do this, we use the following prompt plus all the .md file contents.

This prompt should be applied to each file.

```
these are design docs of a product. you're going to read them and make improvments to them. you're going to make them more clear and detailed. you'll try to find any logical error and missing parts. You're going to output the content of one file at a time without any preceeding comments. Now, output the improved version of foo.md
```
Save the output to out. repeat for each .md. Whenever a md is updated, the new version should be used as the prompt for the next md file.

### 3. doc summary
let the LLM provide a improments summary by providing the original version and the improved version

### 4. generate skeleton
by providing the the improved docs, the folder structure and the summary of each code file, asking the LLM to anaylize if the project is well structured and output an improved version of structure. each code file with an improved version of summary.

create the structure in $PWD/out. write the summary to each file.

### 5. implementing code
ask the llm to implement the code files one by one. each by providing the docs, the improved structures and summaries. When implementing each file, the llm should also output an updated version summary contenting module descriptions & function descriptions as comment part. this updated verision summary will be used to generate the following code files.

### 6. continuous making
before doing 2, 3, 4, 5, the flow should firstly search the $PWD/out folder for the generated contents, and do the unfinished one continuously.

# display
`imk` displays a log each time it invokes openai. in the format below:
```
[imk] improving foo.md ................... [12k/2k] $0.003
[imk] improving bar.md ................... [13k/2k] $0.003
[imk] implementing bar.js ................ [13k/2k] $0.003
```
where 12k is the uploading token counts and 2k is the generated token counts, they should be in human readable format. $0.003 is the fee for this invoke.

the whole output message should be like this:
```
[imk] 14 docs found, 2384 tokens
[imk] improving foo.md ................... [12k/2k] $0.003
[imk] improving bar.md ................... [13k/2k] $0.003
[imk] analyzing file structure ........... [] $
[imk] 38 modules will be created...
[imk] implementing bar.js ................ [13k/2k] $0.003
[imk] implementing bar.js ................ [13k/2k] $0.003
[imk] implementing bar.js ................ [13k/2k] $0.003
...
[imk] job done. cost 2m34s $1.3
```

We need to add some color to this: [imk] and time info should be light blue. token info should be in yellow and dollar info should be in green.