# Writing custom TypeScript code-gens

<time>2024-12-22</time>

TypeScript is one of most used packages for JavaScript languages. It allows writing safer and more manageable code, which is why it was adopted into so many codebases. In almost all cases it is used only as a cli tool to type-check/compile source code. But besides that typescript can be imported as any other package and includes tools for working with typescript code and it’s AST. Using those APIs it is possible to write custom scripts, which may lint the code and report issues, generate code from some input (e.g. OpenAPI) or extracting information from the code (e.g. generating documentation from JSDoc tags). And even though it may not sound like it, but writing tools like that isn’t so hard. Writing a custom codegen has some great advantages, because you have a complete control over that code will be generated it is much simpler to integrate it into your current stack. 

Writing a one-of custom generator is also great, because you probably don’t need to cover all edge-cases of the input data. When writing a codegen which transforms OpenAPI declaration into callable functions, you only have to support your backend and you don’t have to deal with weird quirks of how different backends generate OpenAPI.

## Typescript compiler API

The compiler API doesn’t have documentation

It is not stable yet

## What’s AST?

For compilers to be able to work with the code that programmers write, they need to convert the textual representation to some data structure. This data structure is called abstract syntax tree although it may sound complicated it is just a tree representation what the written code means. To illustrate this better, below is a bit simplified AST of an interface statement.

```ts
export interface Article {
	title: string;
	text: string;
}

// The interface above TypeScript internally parses into something like this
const ast = {
	type: "interface",
	modifiers: ["export"],
	properties: [
		{ name: "title", type: "string" },
		{ name: "text", type: "string" }
	]
}
```

The actual representation is a bit more complicated, but usually this is not a huge problem and you can write your own typegens without understanding it.

TypeScript exposes APIs which allows converting between the textual representation and the AST. Those APIs are used during compilation where the text files are parsed into AST, which is then handed over to compilers, which strips all TypeScript syntax turning it into JavaScript and after this the ast is serialized back into text, which is written to the output file. (The process is a bit more complicated, but fundamentally it is the same.) 

What code generators do is that instead of going from text to text, they are able either turn arbitrary input into AST or turn the AST into any output. TypeScript exposes APIs for creating AST, unfortunately the API is very verbose, but it does not have to be written by hand usually.

```ts

import { factory } from "typescript";

// export interface Example {
//	 a: string;
//	 b: number;
// }

const ast = factory.createInterfaceDeclaration(
	[factory.createToken(ts.SyntaxKind.ExportKeyword)],
	factory.createIdentifier("Example"),
	undefined,
	undefined,
	[
		factory.createPropertySignature(
			undefined,
			factory.createIdentifier("a"),
			undefined,
			factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
		),
		factory.createPropertySignature(
			undefined,
			factory.createIdentifier("b"),
			undefined,
			factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
		)
	]
)

```

## TypeScript AST Viewer

[TypeScript AST Viewer](https://ts-ast-viewer.com) is a great tool for generating code for generating AST (insert some joke about this being meta). You simply enter the output code and it generates all factory calls to generate it. This is great because for example when I was writing a codegen for Rest API calls, I just wrote the resulting code, copied it over and wrapped some of it into if statements and for loops.

## Writing custom code gen

In this section I will describe how to write a simple code generator, which will be able to generate interfaces from a pre-defined input. To start I will create a new project and install dependencies I will be using:

```bash
pnpm init
pnpm i typescript tsx @types/node
```

Then I will create a script file, which I will be running using:

```bash
pnpm tsx scripts/generate.ts
```

As the input I will use the following object, which is a dictionary where each entry defines a interface, where the key is the name and its value is another dictionary, which declares properties of the interface.

```ts
const interfaces = {
	Article: {
		title: "string",
		text: "string",
		createdAt: "Date",
	},
	Author: {
		name: "string",
		age: "number",
	},
} as const;
```

The rest of the generator will look like this:

```ts
// scripts/generate.ts

import ts from "typescript";
import fs from "fs/promises";

const interfaces = { /* ... */ } as const;

// Create a ts printer, which is used to convert AST into text
const printer = ts.createPrinter();
const sourceFile = ts.createSourceFile("types.ts", "", ts.ScriptTarget.ESNext);

// Prepare the output file
await fs.mkdir("./out", { recursive: true });
const handle = await fs.open("./out/types.ts", "w");

// Dictionary of supported types
const types = {
	string: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
	number: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
	Date: ts.factory.createTypeReferenceNode("Date"),
};

for (const [name, properties] of Object.entries(interfaces)) {
	// Code creating the AST
	const ast = ts.factory.createInterfaceDeclaration(
		[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
		ts.factory.createIdentifier(name),
		undefined,
		undefined,
		Object.entries(properties).map(([key, type]) =>
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier(key),
				undefined,
				types[type]
			)
		)
	);

	// Convert the AST to text using printer
	const text = printer.printNode(ts.EmitHint.Unspecified, ast, sourceFile);

	await fs.appendFile(handle, text + "\n\n");
}

await handle.close();
```

After running it with `pnpm tsx scripts/generate.ts` its output should look like this:

```ts
// out/types.ts

export interface Article {
		title: string;
		text: string;
		createdAt: Date;
}

export interface Author {
		name: string;
		age: string;
}

```
