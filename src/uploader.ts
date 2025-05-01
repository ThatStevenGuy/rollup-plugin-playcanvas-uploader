import axios from "axios";
import FormData from "form-data";
import { createReadStream, existsSync } from "fs";
import type { NormalizedOutputOptions, OutputBundle, Plugin, PluginContext } from "rollup";

export interface Options {
    projectId: number;
    branchId: string;
    accessToken: string;
    files: FileInfo[];
}

interface FileInfo {
    path: string;
    assetId: number;
}

const assetsApiUrl = "https://playcanvas.com/api/assets";

export default function upload(options: Options): Plugin {
    return {
        name: "playcanvas-uploader",
        async writeBundle(outputOptions: NormalizedOutputOptions, _bundle: OutputBundle): Promise<void> {
            if(!options) {
                this.error("No options provided.");
            }

            const uploader = new Uploader(this, options);
            const file = outputOptions.file;
            await (file ? uploader.uploadFile(file) : uploader.uploadFiles());
        }
    }
}

class Uploader {
    private readonly _context: PluginContext;
    private readonly _options: Options;

    public constructor(context: PluginContext, options: Options) {
        this._context = context;
        this._options = options;
        this.validateOptions();
    }

    public validateOptions(): void {
        const options = this._options;
        const projectId = options.projectId;
        if(!projectId || !Number.isInteger(projectId)) {
            this.error(`Invalid project ID "${projectId}".`);
        }

        const branchId = options.branchId;
        if(!branchId) {
            this.error(`Invalid branch ID "${branchId}".`);
        }

        const accessToken = options.accessToken;
        if(!accessToken) {
            this.error(`No access token specified.`);
        }

        const files = options.files;
        if(!files || files.length === 0) {
            this.error(`No files specified.`);
        }

        for(let length = files.length, i = 0; i < length; i++) {
            const file = files[i];
            if(!file.path) {
                this.error(`File path not specified.`);
            }

            if(!file.assetId || !Number.isInteger(file.assetId)) {
                this.error(`Invalid asset ID "${file.assetId}" for file "${file.path}".`);
            }
        }
    }

    public async uploadFiles(): Promise<void> {
        const fileInfos = this._options.files;
        for(let length = fileInfos.length, i = 0; i < length; i++) {
            const fileInfo = fileInfos[i];
            await this.uploadFile(fileInfo.path);
        }
    }

    public async uploadFile(filePath: string): Promise<void> {
        const fileInfo = this.getFileInfo(filePath);
        if(!fileInfo) {
            this.error(`File "${filePath}" not found in options.`);
        }

        if(!existsSync(filePath)) {
            this.error(`File "${filePath}" does not exist.`);
        }

        const fileContent = createReadStream(filePath);
        const form = new FormData();
        form.append("file", fileContent);
        form.append("branchId", this._options.branchId);

        try {
            // Upload the file
            this.log(`Uploading file "${fileInfo.path}"...`);
            const fileUri = `${assetsApiUrl}/${fileInfo.assetId}`;
            const response = await axios.put(fileUri, form, {
                headers: {
                    Authorization: `Bearer ${this._options.accessToken}`,
                    "Content-Type": form.getHeaders()["content-type"]
                }
            });

            // Validate the response
            const status = response.status;
            if(status === 200) {
                this.log(`Uploaded file "${fileInfo.path}".`);
            } else {
                this.warn(`Encountered unexpected status code ${status} whilst upload file "${fileInfo.path}": `
                    + response.statusText);
            }
        } catch(error: any) {
            const response = error.response;
            if(!this.validateResponse(response)) {
                return;
            }

            switch(response.status) {
                case 404:
                    // The asset is missing. Create a new one.
                    this.createAsset(fileInfo, filePath);
                    break;
                default:
                    this.warn(`Failed to update asset "${fileInfo.path}": ${response.statusText} (${response.status})`);
                    break;
            }
        }
    }

    private async createAsset(fileInfo: FileInfo, filePath: string): Promise<void> {
        const form = new FormData();
        form.append("name", fileInfo.path);
        form.append("project", this._options.projectId);
        form.append("branchId", this._options.branchId);
        form.append("preload", "true");
        form.append("file", createReadStream(filePath));

        try {
            // Upload the file
            this.log(`Creating asset "${fileInfo.path}"...`);
            const response = await axios.post(assetsApiUrl, form, {
                headers: {
                    Authorization: `Bearer ${this._options.accessToken}`,
                    "Content-Type": form.getHeaders()["content-type"]
                }
            });

            // Validate the response
            if(response.status === 201) {
                this.warn(`Created asset "${fileInfo.path}" with asset ID "${response.data.id}". Please make `
                    + `sure to add this asset ID to the "files"-section of your PlayCanvas Uploader config.`);
            } else {
                this.warn(`Encountered unexpected status code ${response.status} whilst creating a new asset `
                    + `for file ${fileInfo.path}: ${response.statusText}`);
            }
        } catch(error: any) {
            const response = error.response;
            if(!this.validateResponse(response)) {
                return;
            }

            this.warn(`Failed to create asset "${fileInfo.path}" (status code ${response.status}): ` +
                response.statusText);
        }
    }

    private validateResponse(response: any): boolean {
        if(!response) {
            this.error(`Failed to get a general network response. Is your internet connection functioning properly?`);
            return false;
        }

        return true;
    }

    private getFileInfo(path: string): FileInfo | undefined {
        return this._options.files.find((file) => file.path === path);
    }

    private log(message: string): void {
        console.log(message);
    }

    private warn(message: string): void {
        this._context.warn(message);
    }

    private error(message: string): never {
        this._context.error(message);
    }
}