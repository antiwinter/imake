# analyze folder structure
1. check .gitignore, .imkignore
1. generate the origin_doc string by concating all the .md files in the seed folder
1. save the path of all the code files for later use. these code files should include /\.(js|ts|py|html|css|c|cpp|h|hpp|md)$/i
1. we need to save the information in the structure below
```
const db = {
    origin_doc: 'blabla',
    entry: {
        'foo.c': {
            time: 3124801,
            text: '',
            desc: ''
        },
        'bar/baz.c': {
            ...
        }
    }
}
```

# gen temp files
## gen design_doc string from origin_docs
1. check if .imk/design.md exists
1. check if any md files in seed folder is newer than desing.md
1. if newer, generate design_doc from origin_docs using LLM, and save it as design.md
1. if not, use design.md as design_doc

## gen code desc
1. for each code file, check the file with the same path and name but with a suffix .json exists in .imk/ 
1. if not, or its older than the code file, generate desc using LLM and save it to the path with regard to the rule above
1. if its newer, read it as the entry's desc
1. the generating process uses the following prompt
```
please generate a description file of this code, removing any implementing details, leaving only classes, functions and arguments, with a concise description to each class, function and argument. you do not make any comment on my question, but output the content directly. The description json file should be in format of: 
{
    symbol1: {
        type: class  // can also be function, global var, or argument
        desc: '',
        entry: {
            // list vars or function for a class
            // list arguments for function
        }
    }
}
CODE:
`${entry.text}`
```

## 


