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
              task: async () => {
                const dom = new JSDOM(TEMPLATE_BLOG);
                global.document = dom.window.document;
                await renderMarkdown(
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
          const tableBody = document.getElementById("tablebody");
          docs.forEach((doc) => {
            const tr = document.createElement("tr");

            // Create link cell safely
            const linkTd = document.createElement("td");
            const link = document.createElement("a");
            link.href = `posts/${doc.id}.html`;
            link.textContent = doc.id;
            linkTd.appendChild(link);
            tr.appendChild(linkTd);

            // Create date cell safely
            const date = (doc.data().currentTimestamp &&
              doc.data().currentTimestamp.toDate()) as Date;
            const dateTd = document.createElement("td");
            dateTd.textContent = date.getTime().toString();
            dateTd.style.setProperty("opacity", "0");
            dateTd.classList.add("td-date");
            tr.appendChild(dateTd);

            // Create lang cell safely
            const langTd = document.createElement("td");
            langTd.textContent = doc.data().lang ?? "unknown";
            tr.appendChild(langTd);

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
