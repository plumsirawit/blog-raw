import simpleGit from "simple-git";
import * as execa from "execa";
import * as path from "path";

export const innerListenWrite = async (): Promise<void> => {
  const git = simpleGit({
    baseDir: "/tmp",
    binary: "git",
    maxConcurrentProcesses: 6,
  });
  await git.clone(
    "https://github.com/plumsirawit/blog-raw.git",
    "/tmp/blog-raw"
  );
  const yarnPath = path.join(
    process.cwd(),
    "node_modules",
    "yarn",
    "bin",
    "yarn"
  );
  await execa(yarnPath, ["global", "add", "ts-node", "typescript"]);
  await execa(yarnPath, {
    cwd: "/tmp/blog-raw",
  });
  await execa(yarnPath, ["build"], {
    cwd: "/tmp/blog-raw",
  });
  await execa(yarnPath, ["firebase", "deploy", "--only", "hosting"], {
    cwd: "/tmp/blog-raw",
  });
};
