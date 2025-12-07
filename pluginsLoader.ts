import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { Plugin } from "./utils/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadPlugins(): Promise<Plugin[]> {
  const pluginsDir = path.join(__dirname, "plugins");
  
  // Check if plugins directory exists
  if (!fs.existsSync(pluginsDir)) {
    console.error(`Plugins directory not found: ${pluginsDir}`);
    return [];
  }

  // Accept both .js and .ts files
  const files = fs
    .readdirSync(pluginsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

  console.log(`Found ${files.length} plugin files:`, files);

  const plugins: Plugin[] = [];

  for (const file of files) {
    try {
      const pluginPath = path.join(pluginsDir, file);
      const pluginModule = await import(pathToFileURL(pluginPath).href);
      
      if (pluginModule.default) {
        plugins.push(pluginModule.default as Plugin);
        console.log(`✓ Loaded plugin: ${pluginModule.default.pattern}`);
      } else {
        console.warn(`⚠ Plugin ${file} has no default export`);
      }
    } catch (e) {
      console.error(`✗ Failed to load plugin ${file}:`, e);
    }
  }

  console.log(`Total plugins loaded: ${plugins.length}`);
  return plugins;
}