import * as path from "https://deno.land/std/path/mod.ts";

import sass from "https://deno.land/x/denosass/mod.ts";

const filename = Deno.args[0] || "index.html";

const text = await Deno.readTextFile(filename);

const DIST_DIR = path.join(Deno.cwd(), "dist");
const CSS_DIR = path.join(DIST_DIR, "public", "css");

main();

async function main() {
  console.info("%cCompiling HTML...", "color:blue");
  await handleIndex();

  console.info("%cCompiling SASS...", "color:blue");
  await handleSass();

  console.info("%cDone!", "color:green");
}

async function handleIndex() {
  for (const line of text.split("\n")) {
    if (line.includes("@include")) {

      const parsedLine = line.trim().split(" ").filter((item) => item !== "");

      const includeFilename = parsedLine[1] + ".html";

      console.info("%cFound include: " + includeFilename, "color:blue");

      const includeText = format(await Deno.readTextFile(includeFilename));

      const newText = text.replace(line, includeText);

      await Deno.mkdir(DIST_DIR, { recursive: true });
      await Deno.writeTextFile(path.join(DIST_DIR, filename), newText);
    }
  }
}

async function handleSass() {
  const sassText = await Deno.readTextFile("assets/scss/main.scss");

  const cssText = await sass(sassText, {
    style: "expanded",
    load_paths: ["assets/scss"]
  }).to_string() as string;

  await Deno.mkdir(CSS_DIR, {
    recursive: true,
  });

  await Deno.writeTextFile(path.join(CSS_DIR, "main.css"), cssText);
}


function format(text: string): string {
  let newText = text.replace(/\s\s+/g, " ");

  newText = newText.replace("<html>", "");
  newText = newText.replace("</html>", "");
  newText = newText.replace("<body>", "");
  newText = newText.replace("</body>", "");
  newText = newText.replace("<head>", "");
  newText = newText.replace("</head>", "");

  return newText;
}