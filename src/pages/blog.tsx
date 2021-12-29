import { db } from "../global";
import { collection, doc, getDoc } from "firebase/firestore/lite";
import { renderMarkdown } from "../utils/render";
import jsxElem, { render } from "jsx-no-react";

const BlogPage = (
  <main id="content">
    <p>Loading . . .</p>
  </main>
);

function afterRender() {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name");
  if (!name) {
    document.getElementById("content").innerHTML = "Content not found!";
  } else {
    getDoc(doc(collection(db, "blog"), name))
      .then((doc) => {
        if (doc.exists) {
          console.log("Document data:", doc.data());
          renderMarkdown(document.getElementById("content"), doc.data().body);
        } else {
          document.getElementById("content").innerHTML = "Content not found!";
          console.log("No such document!");
        }
      })
      .catch((error) => {
        document.getElementById("content").innerHTML =
          "Error getting document!";
        console.log("Error getting document:", error);
      });
  }
}

render(<BlogPage />, document.getElementById("root"));
document.addEventListener("DOMContentLoaded", function () {
  afterRender();
});
