import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import apiKeys from "./apikeys.json" assert { type: "json" };

export default {
   input: "src/index.ts",
   output: {
      chunkFileNames: "chunk/[name].[hash].js",
      dir: "dist",
      format: "es",
      sourcemap: true,
   },
   plugins: [
      resolve(),
      commonjs(),
      replace({
         preventAssignment: true,
         values: {
            __MyApiKey__: apiKeys.MyApiKey,
            __PoiApiKey__: apiKeys.PoiApiKey
         },
      }),
      typescript(),
      copy({
         targets: [
            { src: "src/index.html", dest: "dist/" },
            { src: "node_modules/@arcgis/core/assets/", dest: "dist/" },
         ],
         copyOnce: true,
      }),
   ],
   preserveEntrySignatures: true,
};
