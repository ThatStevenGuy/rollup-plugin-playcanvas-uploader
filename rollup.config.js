import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

let config;
switch(process.env.target) {
    case "types":
        config = {
            input: "types/index.d.ts",
            output: {
                file: "dist/playcanvas-uploader.d.ts",
                format: "cjs"
            },
            plugins: [dts()],
        };
        break;
    default:
        config = {
            input: "src/index.ts",
            output: [
                { file: "dist/playcanvas-uploader.mjs", format: "es" },
                { file: "dist/playcanvas-uploader.cjs", format: "cjs" }
            ],
            plugins: [typescript()]
        };
        break;
}

export default config;