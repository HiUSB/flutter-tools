import * as _ from "lodash";
import { InputBoxOptions, OpenDialogOptions, Uri, window } from "vscode";
import {
  readdirSync,
  statSync,
  existsSync,
  readdir,
  stat,
  mkdirSync,
  lstatSync,
  writeFile,
  appendFileSync,
  rmSync,
} from "fs";
import * as path from "path";
import * as readline from "readline";
// import * as Jimp from "jimp";
// import Jimp = require("jimp");
import Jimp from "jimp";

import * as vscode from "vscode";
import * as fs from "fs";
import { promisify } from "util";
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const appendFileAsync = promisify(fs.appendFile);

var rootPath = "";

export const imageGenerate = async (uri: Uri) => {
  if (vscode.workspace.workspaceFolders) {
    rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("没有打开的工作区！");
  }

  let targetDirectory = uri.fsPath;
  console.log(targetDirectory);

  try {
    await imagesGen(targetDirectory);
    svgsGen(targetDirectory);
    dartGen(targetDirectory);
    window.showInformationMessage(`Successfully Generated Images Directory`);
  } catch (error) {
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
};

async function imagesGen(targetDirectory: string): Promise<void> {
  let isFirstIteration = true;

  const files = fs.readdirSync(targetDirectory, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      const subdirectory = path.join(targetDirectory, file.name);
      await imagesGen(subdirectory);
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (![".jpeg", ".jpg", ".png"].includes(ext)) {
        continue;
      }

      const imgPath = path.parse(file.name);
      // const dirPath = imgPath.dir.toLowerCase();
      if (!targetDirectory.includes("3.0x")) {
        continue;
      }

      const workDir = path.resolve(targetDirectory, imgPath.dir, "..");
      console.log(file.name, workDir);

      // 创建 2.0x 目录
      if (isFirstIteration) {
        isFirstIteration = false;
        const filesTxtPath = path.join(workDir, "files.txt");
        if (await existsAsync(filesTxtPath)) {
          await unlinkAsync(filesTxtPath);
        }
      }

      // 缩放图片并写入文件列表
      const imgPath1x = path.join(workDir, file.name);
      const imgPath2x = path.join(workDir, "2.0x", file.name);
      const imgPath3x = path.join(targetDirectory, file.name);

      // 2x 目录
      const path2x = path.join(workDir, "2.0x");
      if (!(await existsAsync(path2x))) {
        await mkdirAsync(path2x);
      }

      // 1x 图片
      if (!(await existsAsync(imgPath1x))) {
        await scaleImage(imgPath1x, imgPath3x, 0.3334);
      }

      // 2x 图片
      if (!(await existsAsync(imgPath2x))) {
        await scaleImage(imgPath2x, imgPath3x, 0.6667);
      }

      // 加入记录
      const imgRelativePath = getRelativePath(imgPath1x, rootPath);
      const basename = path.basename(file.name, path.extname(file.name));
      await appendFileAsync(
        path.join(workDir, "files.txt"),
        `static const ${basename} = '${imgRelativePath}';\r\n`,
        { encoding: "utf8" }
      );
    }
  }
}

function svgsGen(targetDirectory: string): void {
  let isFirst = true;

  try {
    // Ensure targetDirectory exists before reading it
    if (!existsSync(targetDirectory)) {
      throw new Error(`Directory '${targetDirectory}' does not exist.`);
    }

    const fileNames = readdirSync(targetDirectory);

    for (const fileName of fileNames) {
      const filePath = path.join(targetDirectory, fileName);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        svgsGen(filePath);
      } else if (stats.isFile()) {
        const imgPath = path.parse(filePath);
        const lowExt = imgPath.ext.toLowerCase();
        if (lowExt !== ".svg") {
          continue;
        }

        const workDir = targetDirectory;
        const filesTxtPath = path.join(workDir, "files.txt");

        // Delete files.txt if it exists and isFirst is true
        if (isFirst) {
          isFirst = false;
          if (existsSync(filesTxtPath)) {
            rmSync(filesTxtPath);
          }
        }

        // Write to files.txt
        const svgName = imgPath.base;
        // const svgPath = path.join("assets/svgs", imgPath.base);
        const svgRelPath = getRelativePath(filePath, rootPath);
        appendFileSync(
          filesTxtPath,
          `static const ${svgName} = '${svgRelPath}';\n`,
          "utf8"
        );
      }
    }
  } catch (error: any) {
    console.error(`Error in svgsGen: ${error.message}`);
  }
}

async function dartGen(targetDirectory: string) {
  const workDir = findFirstMatchingDir(targetDirectory, '3.0x');
  if (workDir === undefined) {
    console.log(`3.0x does not exist`);
    vscode.window.showErrorMessage(`3.0x does not exist`);
    return;
  }

  const filesTxtPath = path.join(workDir, "files.txt");
  if (!(await existsAsync(filesTxtPath))) {
    console.log(`files.txt does not exist in ${workDir}`);
    return;
  }

  const fileStream = fs.createReadStream(filesTxtPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const dartPath = path.join(rootPath, "lib/src/r.dart");

  if (fs.existsSync(dartPath)) {
    fs.unlinkSync(dartPath);
    console.log(`File ${dartPath} exists and has been deleted.`);
  } else {
    const dir = path.dirname(dartPath);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`File ${dartPath} does not exist. The directory ${dir} has been created.`);
  }

  const writeStream = fs.createWriteStream(dartPath);

  writeStream.write('abstract class R {\n');
  for await (const line of rl) {
    writeStream.write('\t' + line + '\n');
  }
  writeStream.write('}');
  writeStream.end();

  fs.unlinkSync(filesTxtPath);
  console.log(`files.txt has been deleted.`);
}

function findFirstMatchingDir(dir: string, match: string): string | undefined {
  if (dir.includes(match)) {
    return path.dirname(dir);
  }
  const files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file.includes(match)) {
        return dir;
      } else {
        let found = findFirstMatchingDir(fullPath, match);
        if (found) return found;
      }
    }
  }
}

const scaleImage = (
  destinationImagePath: string,
  imagePath: string,
  scale: number
) => {
  return new Promise<void>((resolve, reject) => {
    Jimp.read(imagePath, (error, image) => {
      if (error) {
        reject(error);
        console.log(error);
        throw error;
      }
      let w = image.bitmap.width * scale;
      let h = image.bitmap.height * scale;
      // w h 取整
      w = Math.round(w);
      h = Math.round(h);
      image.resize(w, h).write(destinationImagePath);
      resolve();
    });
  });
};

const getRelativePath = (filePath: string, targetDirectory: string): string => {
  const relativePath = path.relative(targetDirectory, filePath);
  return relativePath.replace(/\\/g, "/");
};
