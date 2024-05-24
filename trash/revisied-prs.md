Here's the revised version of your document, with added details about the prompts where the system may query a language model (LLM) like OpenAI's GPT:

# iMake

iMake, short for AI Make, is an advanced tool designed to transform various inputs such as documents, code, outlines, and templates into a range of outputs including documents and code. This tool leverages AI to enhance productivity and streamline the creation process.

## Development

The development of iMake utilizes Node.js with ECMAScript Modules (ESM). Key libraries used in the project include `commander` for command-line interfaces, `got` for HTTP requests, and `chalk` for terminal string styling. The tool can be installed globally using npm or Yarn with the command:
```bash
npm install -g imk
```
or 
```bash
yarn global add imk
```

## Functions

### Simple Make

Executing the command `imk` within a code folder initiates a basic generation process. This process involves several key steps:

#### 1. Check Ignored Files
iMake begins by checking `.gitignore` and `.imkignore` files to determine which files and folders should be excluded from the process.

#### 2. Improve Designs
iMake searches for Markdown (.md) files that define the project's functionality and the relationships between modules. The tool then enhances these documents, aiming to clarify and detail their content while identifying and correcting any logical errors or omissions. The improved Markdown files are saved in a directory structure mirroring the original within `$PWD/out`. Each file is processed individually using the following prompt to guide the improvement process:
```
Prompt: "Review and improve the clarity and detail of the documentation, ensuring logical consistency and completeness."
```

#### 3. Document Summary
After improving the documents, iMake generates a summary comparing the original and enhanced versions, highlighting key improvements and changes. This summary is saved to `$PWD/out/summary-doc.md`.

#### 4. Generate Skeleton
Using the enhanced documentation, iMake analyzes the project's structure. It then suggests improvements and creates an optimized version of the project structure, including detailed summaries for each code file. These structures and summaries are saved in `$PWD/out`. The following prompt is used for generating the structure report:
```
Prompt: "Analyze the improved documentation to suggest a refined project structure and file summaries."
```
Generate a report and save to `$PWD/out/structure-doc.md`.

#### 5. Implementing Code
iMake proceeds to implement the code files based on the improved documents, structure, and summaries. Each file is developed one at a time, with the tool providing updated summaries that include module and function descriptions. These summaries guide the development of subsequent files. The implementation uses the prompt:
```
Prompt: "Based on the provided documentation and structure summaries, implement the code, ensuring to include detailed comments describing each module and function."
```

#### 6. Continuous Making
Before starting the steps above, iMake checks `$PWD/out` for any previously generated content and continues the process from where it left off, ensuring a seamless and efficient workflow.

### tune
```
imk --tune FILE # tune a file according to inline TODOs and FIXMEs
imk --tune FILE[#FUNC] [PROMPT] # tune a file or function according to a prompt
imk --tune FUNC # search for the function for tuning, prompt for selection if multiple
```

## Display

iMake provides detailed logs for each operation, formatted as follows:
```bash
[openai] improving foo.md ................... [12k/2k] $0.003
[openai] improving bar.md ................... [13k/2k] $0.003
[openai] implementing bar.js ................ [13k/2k] $0.003
```
These logs include the number of tokens processed, the cost of the operation, and are color-coded for enhanced readability: `[imk]` and timestamps in light blue, token information in yellow, and cost details in green.

The complete output message provides a comprehensive overview of the operations performed, total cost, and duration, ensuring transparency and ease of tracking throughout the process.

```bash
[imk] 14 docs found, 2384 tokens
[openai] improving foo.md ................... [12k/2k] $0.003
[openai] improving bar.md ................... [13k/2k] $0.003
[openai] analyzing file structure ........... [] $
[imk] 38 modules will be created
[openai] implementing bar.js ................ [13k/2k] $0.003
[openai] implementing bar.js ................ [13k/2k] $0.003
[openai] implementing bar.js ................ [13k/2k] $0.003
...
[imk] job done. cost 2m34s $1.3
```