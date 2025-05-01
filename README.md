# PlayCanvas Uploader 🚀
[![npm version](https://img.shields.io/npm/v/rollup-plugin-playcanvas-uploader.svg)](https://www.npmjs.com/package/rollup-plugin-playcanvas-uploader)
[![license](https://img.shields.io/npm/l/rollup-plugin-playcanvas-uploader.svg)](LICENSE)
[![downloads](https://img.shields.io/npm/dm/rollup-plugin-playcanvas-uploader.svg)](https://www.npmjs.com/package/rollup-plugin-playcanvas-uploader)

A lightweight Rollup plugin to automatically upload your bundles to PlayCanvas.

ℹ️ **Looking for the Webpack version?** [webpack-playcanvas-uploader](https://www.npmjs.com/package/webpack-playcanvas-uploader)

## Installation
```
npm install rollup-plugin-playcanvas-uploader --save-dev
```
## Getting Your Project Information
Follow these steps to obtain your PlayCanvas project information:
1. Create an empty script in your PlayCanvas project (e.g. `main.js`) and click on it to open the inspector. Copy the file's ID (a numeric value at the top). Whenever you make a bundle using Rollup, the contents of your bundle will be uploaded to this script file.
2. Open your browser's console and enter `config.accessToken`, `config.project.id` and `config.self.branch.id`. Copy over the values.

## Usage
Add the following to your `rollup.config.js`. Make sure to replace the placeholders with the values obtained earlier.
```
import uploader from "rollup-plugin-playcanvas-uploader";

export default {
    input: "src/index.js",
    output: {
        file: "dist/main.js"
    },
    plugins: [uploader({
        projectId: yourProjectId,
        branchId: yourBranchId,
        accessToken: yourAccessToken,
        files: [
            { path: "dist/main.js", assetId: yourScriptId }
        ]
    })]
};
```
You're all set! 🎉 PlayCanvas Uploader will now automatically upload your bundles.

## Security
⚠️ **Keep your access token secret!**

Do not commit it to Git. You can instead store it in a Git-ignored JSON file and import it into your `rollup.config.js`. Alternatively, you can add your access token as an environment variable and use `process.env` to access it (e.g. `process.env.PLAYCANVAS_ACCESS_TOKEN`).

## Bug Reports & Feature Requests
Bug reports and feature requests welcome — please open an issue on [GitHub](https://github.com/ThatStevenGuy/rollup-plugin-playcanvas-uploader/issues).

## License
MIT © 2025 Steven Derks  
Distributed under the MIT License. See the [LICENSE](https://github.com/ThatStevenGuy/rollup-plugin-playcanvas-uploader/blob/main/LICENSE) file for details.