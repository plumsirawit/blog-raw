process.env.BIN_SCRIPT = "true";
import { execa } from "execa";
import Listr from "listr";
import * as fs from "fs";

const TEMPLATE = fs.readFileSync("./src/template.html").toString();

const tasks = new Listr([
  {
    title: "Clear directory",
    task: () => execa("rm", ["-rf", "public"]),
  },
  {
    title: "Bundle packages",
    task: () => execa("yarn", ["bundle"]),
  },
  {
    title: "Generate HTML pages",
    task: () => {
      const files = fs.readdirSync("./public/pages");
      return new Listr(
        files.map((file) => {
          file = file.split(".")[0];
          return {
            title: `Generate ${file}.html`,
            task: () => {
              fs.writeFileSync(
                `./public/${file}.html`,
                TEMPLATE.replace("<FILENAME>", file)
              );
            },
          };
        })
      );
    },
  },
  {
    title: "Prepare static files",
    task: () => {
      execa("cp", ["./src/global.css", "./public/global.css"]);
    },
  },
]);

tasks.run().catch((err) => {
  console.error(err);
});
