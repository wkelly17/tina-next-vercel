import * as fs from "node:fs/promises";
import {readFileSync} from "node:fs";
import {getInput} from "@actions/core";
import {type Globber, create as globCreate} from "@actions/glob";
import matter from "gray-matter";
import {mdxjs} from "micromark-extension-mdxjs";
import {fromMarkdown} from "mdast-util-from-markdown";
import {mdxFromMarkdown, mdxToMarkdown} from "mdast-util-mdx";
import {toMarkdown} from "mdast-util-to-markdown";
import {visit} from "unist-util-visit";
import * as deepl from "deepl-node";
import {createHash} from "crypto";
import path from "node:path";
import {createTranslationCache} from "./cache/index.js";
import {isDeepLSupported, type localeType} from "./utils.js";
import "dotenv/config";
import {manageDiff} from "./manageDiff.js";

console.log(process.env.NODE_ENV);
const rootDir =
  process.env.NODE_ENV && process.env.NODE_ENV == "CI"
    ? process.cwd()
    : path.resolve("../");
const deepLKey =
  process.env.NODE_ENV && process.env.NODE_ENV == "CI"
    ? getInput("deepLKey")
    : (process.env.DEEPLKEY as string);

let diff = null;
if (process.env.NODE_ENV && process.env.NODE_ENV == "CI") {
  let diffPath = getInput("prevDiffPath");
  console.log({diffPath});
  let diff = readFileSync(diffPath, {
    encoding: "utf-8",
  });
  console.log("Received CI diff");
  console.log(diff);
} else {
  try {
    diff = readFileSync(`${rootDir}/translate/src/example.diff`, {
      encoding: "utf-8",
    });
  } catch (error) {
    console.log("generate a diff to work on this functionality");
    // nooop dev err
  }
}
const translationCache = createTranslationCache(
  `${rootDir}/translate/cache.sqlite3`
);
// This will update translations cache if there are things that have changed
if (diff) {
  manageDiff(diff, translationCache);
}

async function run() {
  const localesPath = `${rootDir}/site/siteConfig/locales.json`;
  const localesString = await fs.readFile(localesPath, {
    encoding: "utf-8",
  });
  const localesJson = JSON.parse(localesString);
  const locales = localesJson.locales;
  const globber = await globCreate(`${rootDir}/site/content/en/**/*.mdx`);
  const menusGlobber = await globCreate(`${rootDir}/site/content/en/menus/*`);

  const translator = new deepl.Translator(deepLKey);
  await handleMdx(globber, translator, locales);
  await handleMenus(menusGlobber, translator, locales);
}
async function handleMdx(
  englishMdx: Globber,
  translator: deepl.Translator,
  localesJson: Array<localeType>
) {
  for await (const englishFile of englishMdx.globGenerator()) {
    const fileData = await fs.readFile(englishFile, {
      encoding: "utf-8",
    });
    let file = matter({
      content: fileData,
    });
    // No need to translate if opting out
    if (file.data?.localize === false) continue;
    const needsUpdating = await manageFileSha(file, englishFile);
    if (!needsUpdating) {
      continue;
    }
    console.log(`working on ${englishFile}`);
    for await (const targetLocale of localesJson) {
      if (targetLocale.code == "en") continue; //base lang
      if (!isDeepLSupported.has(targetLocale.code)) {
        console.log(
          `${targetLocale.name} code:${targetLocale.code} is not deepL supported`
        );
        continue;
      }
      const fileOutPath = englishFile.replace("/en/", `/${targetLocale.code}/`);
      const dir = path.dirname(fileOutPath);
      await fs.mkdir(dir, {recursive: true});
      let needsTranslating = true;
      try {
        needsTranslating = await checkIfTargetFileIsMarkedToNotTranslate(
          fileOutPath
        );
      } catch (error) {
        // noop:
        // console.log(error);
      }
      if (!needsTranslating) continue;

      const langCopy = {...file};
      const yamlContent = langCopy.data;
      const coercedLocaleCode = targetLocale.code as deepl.TargetLanguageCode;
      // Manage the yaml for the pages
      if (englishFile.includes("/pages/") && yamlContent.title) {
        const cacheSha = await getSha256(
          `${yamlContent.title}-${coercedLocaleCode}`
        );
        const cachedRow = translationCache.findRowById(cacheSha);
        if (
          !cachedRow ||
          (typeof cachedRow === "object" && !("content" in cachedRow))
        ) {
          try {
            const translatedTitle = await translator.translateText(
              yamlContent.title,
              "en",
              coercedLocaleCode
            );
            if (!Array.isArray(translatedTitle)) {
              yamlContent.title = translatedTitle.text;
              translationCache.writeRow({
                id: cacheSha,
                content: translatedTitle.text,
                lastUsed: new Date().toISOString(),
              });
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          yamlContent.title = cachedRow.content;
        }
      }
      // Manage the body:

      const tree = fromMarkdown(file.content, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      });

      const translationMap = new Map();

      // Step 1: Push all text nodes to an array and populate the translation map
      const textNodes: any[] = [];
      const promises: Array<Promise<any>> = [];

      visit(tree, "text", (node, index, parent) => {
        if (
          parent &&
          // @ts-ignore
          parent.attributes?.some((attr) => attr.name == "data-no-translate")
        ) {
          // noop
          // console.log(parent);
          // console.log("do not translate this value");
        } else {
          const promise = getSha256(`${node.value}-${coercedLocaleCode}`).then(
            (shaLangCode) => {
              if (shaLangCode) {
                textNodes.push({node, shaLangCode});
                translationMap.set(shaLangCode, {node, translation: null});
              }
            }
          );
          promises.push(promise);
        }
      });

      // Wait for all promises to resolve before continuing
      await Promise.all(promises);

      // Step 2: Filter the array by checking for the presence of SHA256-langCode in the cache
      const nodesToTranslate = textNodes.filter((node) => {
        const {shaLangCode} = node;
        const matchingRow = translationCache.findRowById(shaLangCode);

        // Go ahead and mutate the node we are writing back out
        if (matchingRow) {
          node.node.value = matchingRow.manual_translation
            ? matchingRow.manual_translation
            : matchingRow.content;
        }
        return matchingRow ? false : true;
      });
      const onlyTextNodes = nodesToTranslate.map((node) => node.node.value);
      if (!onlyTextNodes.length) {
        console.log(`no new nodes to translate for ${fileOutPath}`);
      }
      // Step 3: Run DeepL translate on the batch

      let translations: deepl.TextResult[] | null = null;
      if (onlyTextNodes.length) {
        try {
          translations = await translator.translateText(
            onlyTextNodes,
            "en",
            coercedLocaleCode
          );
        } catch (error) {
          console.error(error);
        }
      }
      if (translations) {
        // Step 4: Update the translation map with the translations
        translations.forEach((result, index) => {
          const {shaLangCode} = nodesToTranslate[index];
          const {node} = translationMap.get(shaLangCode);
          translationMap.set(shaLangCode, {node, translation: result.text});
        });
      }

      // Step 5: Reinsert the original nodes and their translations back into the tree
      translationMap.forEach((value, key, map) => {
        if (value.translation !== null) {
          // Update the original text node with the translation
          value.node.value = value.translation;
          translationCache.writeRow({
            id: key,
            content: value.translation,
            lastUsed: new Date().toISOString(),
          });
        }
      });
      const out = toMarkdown(tree, {extensions: [mdxToMarkdown()]});
      const finishedTranslation = matter.stringify({content: out}, yamlContent);
      await fs.writeFile(fileOutPath, finishedTranslation);
      // Json version for header
    }
  }
}
// todo: if desired can make this do menus as well
async function handleMenus(
  englishJson: Globber,
  translator: deepl.Translator,
  localesJson: Array<localeType>
) {
  for await (const englishFile of englishJson.globGenerator()) {
    const fileData = await fs.readFile(englishFile, {
      encoding: "utf-8",
    });
    const fileJson = JSON.parse(fileData) as {
      menuLinks: any[];
      sha256?: string;
    };
    const keysToLocalize = ["label", "description"];
    const currentSha = fileJson.sha256;
    const calculatedSha = await getSha256(JSON.stringify(fileJson.menuLinks));
    let needsUpdating = calculatedSha !== currentSha;
    fileJson.sha256 = calculatedSha;
    // write out new sha:
    await fs.writeFile(englishFile, JSON.stringify(fileJson));
    if (!needsUpdating) continue;
    for await (const targetLocale of localesJson) {
      if (targetLocale.code == "en") continue; //base lang
      if (!isDeepLSupported.has(targetLocale.code)) {
        console.log(
          `${targetLocale.name} code:${targetLocale.code} is not deepL supported`
        );
        continue;
      }
      const fileOutPath = englishFile.replace("/en/", `/${targetLocale.code}/`);
      const dir = path.dirname(fileOutPath);
      await fs.mkdir(dir, {recursive: true});
      const langCopy = {...fileJson};
      await translateKeys(langCopy, targetLocale.code, keysToLocalize);
      const outChecksum = createHash("sha256")
        .update(JSON.stringify(langCopy.menuLinks), "utf-8")
        .digest("hex");
      langCopy.sha256 = outChecksum;
      await fs.writeFile(fileOutPath, JSON.stringify(langCopy));
    }
    console.log("done with menus");

    async function translateKeys(
      obj: Record<any, any>,
      locale: string,
      keysToLocalize: string[]
    ) {
      if (obj instanceof Object) {
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            await translateKeys(obj[i], locale, keysToLocalize); // Recursive call for array elements
          }
        } else {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (typeof obj[key] === "object") {
                await translateKeys(obj[key], locale, keysToLocalize); // Recursive call for objects
              } else if (
                typeof obj[key] === "string" &&
                keysToLocalize.includes(key)
              ) {
                // Perform your translation logic here (assuming you have an async translation function)
                const coercedLocale = locale as deepl.TargetLanguageCode;
                try {
                  const translatedVal = await translator.translateText(
                    obj[key],
                    "en",
                    coercedLocale
                  );
                  if (!Array.isArray(translatedVal)) {
                    obj[key] = translatedVal.text;
                  }
                } catch (error) {
                  console.log(error);
                }
              }
            }
          }
        }
      }
    }
  }
}

run();

async function manageFileSha(
  file: matter.GrayMatterFile<string>,
  filePath: string
) {
  let needsUpdating = false;
  const currentSha256 = createHash("sha256")
    .update(file.content, "utf-8")
    .digest("hex");
  if (file.data?.sha256 == currentSha256) {
    console.log(
      `checksum for ${filePath} not changed since last build: continue \n\n`
    );
    return needsUpdating;
  } else {
    file.data.sha256 = currentSha256;
    const withChecksum = matter.stringify({content: file.content}, file.data);
    needsUpdating = true;
    await fs.writeFile(filePath, withChecksum);
    return needsUpdating;
  }
}
async function checkIfTargetFileIsMarkedToNotTranslate(fileOutPath: string) {
  let needsTranslating = true;
  try {
    let existingTargetFile = await fs.readFile(fileOutPath, {
      encoding: "utf-8",
    });
    let fileWithData = matter({
      content: existingTargetFile,
    });
    // intentional. Strictly false in yaml, not just falsy
    // todo: this needs testing;
    if (fileWithData.data?.localize === false) {
      needsTranslating = false;
      return needsTranslating;
    } else return needsTranslating;
  } catch (error) {
    return needsTranslating;
  }
}
async function getSha256(str: string) {
  const sha = createHash("sha256").update(str, "utf-8").digest("hex");
  return sha;
}
// export async function walk(dir: string = "./src/content"): Promise<string[]> {
//   let files: any[] = await readdir(dir);
//   files = await Promise.all(
//     files.map(async (file: string) => {
//       const filePath: string = path.join(dir, file);
//       const stats = await stat(filePath);
//       if (stats.isDirectory()) return walk(filePath);
//       else if (stats.isFile()) return filePath;
//     })
//   );

//   return files.reduce((all, folderContents) => all.concat(folderContents), []);
// }

/* 

/* 
en -> auto (store in cache) -> change manually
updated en -> check current tree. For each node, is it in the cache? If not it's changed. But how do we align it to the english? 


// When a node changes (e.g) PRE to pre, I know that PRE was the auto of FAQ, therefore, I know that pre is now associated with faq.  So, when a change happens, I need to gather all the lies in a content file that were changed. 


PREGUNTAS FREQCUENTES -> PRE FR
PRE -> DELETED

For each Negative that has a corresponding postivie, I want to write them out as prev + next: 
*/
