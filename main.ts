import * as path from "https://deno.land/std@0.161.0/path/mod.ts";

import sass from "https://deno.land/x/denosass@1.0.4/mod.ts";

const filename = Deno.args[0] || "index.html";

const DIST_DIR = path.join(Deno.cwd(), "dist");
const CSS_DIR = path.join(DIST_DIR, "public", "css");

main();

async function main() {
  console.info("%cStarting...", "color:blue");

  console.info("%cEnsuring directories...", "color:blue");
  await ensureDirs();

  console.info("%cCopying media...", "color:blue");
  await handleMedia();

  console.info("%cCompiling HTML...", "color:blue");
  await handleInput(filename);

  console.info("%cCompiling SASS...", "color:blue");
  await handleSass();

  console.info("%cDone!", "color:green");
}

async function ensureDirs() {
  await Deno.mkdir(DIST_DIR, {
    recursive: true
  });

  await Deno.mkdir(CSS_DIR, {
    recursive: true,
  });

  await Deno.mkdir(path.join(DIST_DIR, "public", "media"), {
    recursive: true,
  });
}

async function handleInput(filename: string) {
  const text = await Deno.readTextFile(filename);

  const newText = await handleIncludes(text);

  await Deno.writeTextFile(path.join(DIST_DIR, filename), newText);
}

async function handleIncludes(text: string): Promise<string> {
  let newText = text;

  for (const line of text.split("\n")) {
    if (line.includes("@include")) {
      const parsedLine = line.trim().split(" ").filter((item) => item !== "");

      const includeFilename = parsedLine[1] + ".html";

      console.info("%cFound include: " + includeFilename, "color:blue");

      const includeText = await Deno.readTextFile(includeFilename);

      const handledIncludes = await handleIncludes(includeText);

      newText = newText.replace(line, format(handledIncludes));
    }
  }

  return newText;
}

async function handleSass() {
  const sassText = await Deno.readTextFile("assets/scss/main.scss");

  const cssText = await sass(sassText, {
    style: "expanded",
    load_paths: ["assets/scss"]
  }).to_string() as string;

  await Deno.writeTextFile(path.join(CSS_DIR, "main.css"), cssText);
}

async function handleMedia() {
  const mediaDir = path.join(Deno.cwd(), "assets", "media");
  const mediaFiles = await Deno.readDir(mediaDir);

  for await (const file of mediaFiles) {
    const src = path.join(mediaDir, file.name);
    const dest = path.join(DIST_DIR, "public", "media", file.name);

    await copyFileOrDir(src, dest);
  }
}

function copyFileOrDir(src: string, dest: string) {
  const srcInfo = Deno.statSync(src);
  if (srcInfo.isDirectory) {
    Deno.mkdir(dest, { recursive: true })

    const files = Deno.readDirSync(src);

    for (const file of files) {
      const srcFile = path.join(src, file.name);
      const destFile = path.join(dest, file.name);

      copyFileOrDir(srcFile, destFile);
    }
  } else {
    Deno.copyFile(src, dest);
  }
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