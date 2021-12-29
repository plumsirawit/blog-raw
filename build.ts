process.env.BIN_SCRIPT = "true";
import { Listr, ListrTask } from "listr2";
import * as fs from "fs";
import { db } from "./src/global";
import { collection, getDocs, orderBy, query } from "firebase/firestore/lite";
import { renderMarkdown } from "./src/utils/render";
import { JSDOM } from "jsdom";
import * as esbuild from "esbuild";

const TEMPLATE = fs.readFileSync("./src/template.html").toString();
const TEMPLATE_INDEX = fs.readFileSync("./src/template-index.html").toString();
const TEMPLATE_BLOG = fs.readFileSync("./src/template-blog.html").toString();

const tasks = new Listr(
  [
    {
      title: "Clear directory",
      task: () => {
        fs.rmSync("public", {
          recursive: true,
          force: true,
        });
      },
    },
    {
      title: "Bundle packages",
      task: () => {
        const files = fs.readdirSync("./src/pages");
        esbuild.buildSync({
          entryPoints: files.map((file) => `./src/pages/${file}`),
          bundle: true,
          outdir: "public/pages",
          minify: true,
          jsxFactory: "jsxElem.createElement",
          jsxFragment: "jsxElem.Fragment",
        });
      },
    },
    {
      title: "Generate HTML pages",
      task: (_, task) => {
        const files = fs.readdirSync("./public/pages");
        return task.newListr(
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
        fs.copyFileSync("./src/global.css", "./public/global.css");
      },
    },
    {
      title: "Generating blog posts",
      task: async (_, task) => {
        fs.mkdirSync("public/posts");
        const docs = await getDocs(collection(db, "blog"));
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
      title: "Make a static index.html",
      task: async () => {
        const dom = new JSDOM(TEMPLATE_INDEX);
        const { document } = dom.window;
        const createTd = (text: string) => {
          const td = document.createElement("td");
          td.innerHTML = text;
          return td;
        };
        const tableBody = document.getElementById("tablebody");
        await getDocs(
          query(collection(db, "blog"), orderBy("currentTimestamp", "desc"))
        )
          .then((docs) => {
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
                createTd(
                  dateTimeString.slice(0, dateTimeString.indexOf("(") - 1)
                )
              );
              tr.appendChild(createTd(doc.data().lang ?? "unknown"));
              tableBody?.appendChild(tr);
            });
          })
          .catch((error) => {
            console.log("Error getting document:", error);
          });
        fs.writeFileSync(`./public/index.html`, dom.serialize());
      },
    },
  ],
  { concurrent: false }
);

tasks.run().catch((err) => {
  console.error(err);
});
