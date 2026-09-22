import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const SOURCES = [
  "src/blog-search.generated.js",
  "src/adrock-webmcp.js",
  "src/search-blog-tool.js"
];

export async function buildFramerSnippet({
  sources = SOURCES,
  outputPath = "dist/adrock-webmcp-framer.html"
} = {}) {
  const parts = [];
  for (const source of sources) {
    parts.push(await readFile(source, "utf8"));
  }

  const content = `<script>
${parts.join("\n\n")}
</script>
`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");

  return { output: outputPath, source_count: sources.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await buildFramerSnippet(), null, 2));
}
