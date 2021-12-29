import { db } from "../global";
import { collection, orderBy, query, getDocs } from "firebase/firestore/lite";
import jsxElem, { render } from "jsx-no-react";

const IndexPage = (
  <div className="fragment">
    <header>
      <h1 className="head-mono">blog.plummmm.com</h1>
      <h3 className="head-mono">A (quickly-made) personal blog</h3>
      <p id="content">Loading . . .</p>
    </header>
    <main>
      <table id="maintable">
        <thead>
          <tr>
            <th>Blog</th>
            <th>Date</th>
            <th>Language</th>
          </tr>
        </thead>
        <tbody id="tablebody"></tbody>
      </table>
    </main>
  </div>
);

function afterRender() {
  const tableBody = document.getElementById("tablebody");
  getDocs(query(collection(db, "blog"), orderBy("currentTimestamp", "desc")))
    .then((docs) => {
      docs.forEach((doc) => {
        console.log(doc);
        const tr = document.createElement("tr");
        tr.appendChild(
          <td>
            <a href={`blog.html?name=${doc.id}`}>{doc.id}</a>
          </td>
        );
        const date =
          doc.data().currentTimestamp &&
          new Date(doc.data().currentTimestamp.seconds * 1000);
        const dateTimeString = date.toDateString() + " " + date.toTimeString();
        tr.appendChild(
          <td>{dateTimeString.slice(0, dateTimeString.indexOf("(") - 1)}</td>
        );
        tr.appendChild(<td>{doc.data().lang ?? "unknown"}</td>);
        tableBody.appendChild(tr);
      });
      document.getElementById("content").innerHTML = "";
    })
    .catch((error) => {
      document.getElementById("content").innerHTML = "Error getting document!";
      console.log("Error getting document:", error);
    });
}

render(<IndexPage />, document.getElementById("root"));
document.addEventListener("DOMContentLoaded", function () {
  afterRender();
});
