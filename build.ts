process.env.BIN_SCRIPT = "true";
import { Listr, ListrTask } from "listr2";
import * as fs from "fs";
import { db } from "./src/global";
import { collection, getDocs, orderBy, query } from "firebase/firestore/lite";
import { renderMarkdown } from "./src/utils/render";
import { JSDOM } from "jsdom";
import * as esbuild from "esbuild";

const TEMPLATE_INDEX = fs.readFileSync("./src/template-index.html").toString();
const TEMPLATE_BLOG = fs.readFileSync("./src/template-blog.html").toString();

getDocs(
  query(collection(db, "blog"), orderBy("currentTimestamp", "desc"))
).then(async (docs) => {
  const tasks = new Listr(
    [
      {
        title: "Prepare public directory",
        task: () => {
          fs.rmSync("public", {
            recursive: true,
            force: true,
          });
          fs.mkdirSync("public");
        },
      },
      {
        title: "Prepare static global.css",
        task: () => {
          fs.copyFileSync("./src/global.css", "./public/global.css");
        },
      },
      {
        title: "Bundle global.ts",
        task: () => {
          esbuild.buildSync({
            entryPoints: ["./src/global.ts"],
            bundle: true,
            outfile: "public/global.js",
            globalName: "bundle",
            minify: true,
          });
        },
      },
      {
        title: "Generate static admin.html",
        task: () => {
          fs.copyFileSync("./src/template-admin.html", "./public/admin.html");
        },
      },
      {
        title: "Generating blog posts",
        task: async (_, task) => {
          fs.mkdirSync("public/posts");
          const jobs: ListrTask<any>[] = [];
          docs.forEach((doc) => {
            jobs.push({
              title: `Generate ${doc.id}.html`,
              task: () => {
                const dom = new JSDOM(TEMPLATE_BLOG);
                global.document = dom.window.document;
                renderMarkdown(
                  dom.window.document.getElementById("content")!,
                  doc.data().body
                );
                fs.writeFileSync(
                  `./public/posts/${doc.id}.html`,
                  dom.serialize()
                );
              },
            });
          });
          return task.newListr(jobs, {
            concurrent: false,
            rendererOptions: { collapse: false },
          });
        },
      },
      {
        title: "Generate static index.html",
        task: async () => {
          const dom = new JSDOM(TEMPLATE_INDEX);
          const { document } = dom.window;
          const createTd = (text: string) => {
            const td = document.createElement("td");
            td.innerHTML = text;
            return td;
          };
          const tableBody = document.getElementById("tablebody");
          docs.forEach((doc) => {
            const tr = document.createElement("tr");
            tr.appendChild(
              createTd(`<a href="posts/${doc.id}.html">${doc.id}</a>`)
            );
            const date =
              doc.data().currentTimestamp &&
              new Date(doc.data().currentTimestamp.seconds * 1000);
            const dateTimeString =
              date.toDateString() + " " + date.toTimeString();
            tr.appendChild(
              createTd(dateTimeString.slice(0, dateTimeString.indexOf("(") - 1))
            );
            tr.appendChild(createTd(doc.data().lang ?? "unknown"));
            tableBody?.appendChild(tr);
          });
          fs.writeFileSync(`./public/index.html`, dom.serialize());
        },
      },
    ],
    { concurrent: false }
  );

  try {
    return await tasks.run();
  } catch (err) {
    console.error(err);
  }
});
