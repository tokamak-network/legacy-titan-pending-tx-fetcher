import fs from "fs";

export class FileStorageService {
  static writeToFile = async (fileName: string, data: any) => {
    await fs.promises.writeFile(fileName, JSON.stringify(data, null, 2));
  };
  static readFromFile = async (fileName: string) => {
    return await fs.promises.readFile(fileName, "utf8");
  };
  static createDirectory = async (dirPath: string) => {
    await fs.promises.mkdir(dirPath, { recursive: true });
  };
}
