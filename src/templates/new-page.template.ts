import * as changeCase from "change-case";
import { existsSync, lstatSync, writeFile } from "fs";

// index
export function indexTemplate(pageName: string, targetDirectory: string) {
  const pascalCaseName = changeCase.pascalCase(pageName.toLowerCase());
  const snakeCaseName = changeCase.snakeCase(pageName.toLowerCase());
  const targetPath = `${targetDirectory}/${pageName}/index.dart`;
  const template = `library ${snakeCaseName};

export './view_model.dart';
export './view.dart';
`;

  return new Promise(async (resolve, reject) => {
    writeFile(targetPath, template, "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve;
    });
  });
}

// controller
export function controllerTemplate(pageName: string, targetDirectory: string) {
  const pascalCaseName = changeCase.pascalCase(pageName.toLowerCase());
  const snakeCaseName = changeCase.snakeCase(pageName.toLowerCase());
  const targetPath = `${targetDirectory}/${pageName}/view_model.dart`;
  const viewModel = `${pascalCaseName}ViewModel`;
  const model = `${pascalCaseName}Model`;
  const provider = pageName.charAt(0).toLowerCase() + pageName.slice(1) + `Provider`;

  const template = `\
import 'package:flutter_riverpod/flutter_riverpod.dart';

final ${provider} = StateNotifierProvider.autoDispose<${viewModel}, ${model}>(
  (ref) => ${viewModel}(${model}()));

class ${viewModel} extends StateNotifier<${model}> {
  ${viewModel}(super.state);
}

class ${model} {
  ${model}();
}
`;

  return new Promise(async (resolve, reject) => {
    writeFile(targetPath, template, "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve;
    });
  });
}

// view
export function viewTemplate(pageName: string, targetDirectory: string) {
  const pascalCaseName = changeCase.pascalCase(pageName.toLowerCase());
  const snakeCaseName = changeCase.snakeCase(pageName.toLowerCase());
  const targetPath = `${targetDirectory}/${pageName}/view.dart`;
  const template = `\
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'index.dart';

class ${pascalCaseName}Page extends ConsumerStatefulWidget {
  const ${pascalCaseName}Page({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _${pascalCaseName}PageState();
}

class _${pascalCaseName}PageState extends ConsumerState<${pascalCaseName}Page> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("${pascalCaseName}Page")),
      body: SafeArea(
        child: _buildView(),
      ),
    );
  }

  /// 主视图
  Widget _buildView() {
    return const Center(
      child: Text("${pascalCaseName}Page"),
    );
  }
}
`;

  return new Promise(async (resolve, reject) => {
    writeFile(targetPath, template, "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve;
    });
  });
}
