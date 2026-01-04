import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",

  // ✅ Node 전용 의존성은 번들에서 제외(권장)
  external: ["ssh2", "ssh2-sftp-client"],

  output: [
    { file: "dist/index.js", format: "cjs", sourcemap: true, exports: "named" },
    { file: "dist/index.esm.js", format: "es", sourcemap: true, exports: "named" },
  ],



  plugins: [
    resolve(),
    json(),       // ✅ JSON 파싱 가능
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    css({ output: "sftp-ui.css" }),
    production ? terser() : undefined,
  ].filter(Boolean),
};
