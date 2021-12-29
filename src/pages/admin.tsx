import { renderMarkdown } from "../utils/render";
import { db } from "../global";
import { collection, doc, getDoc } from "firebase/firestore/lite";
import jsxElem, { render } from "jsx-no-react";

function renderText() {
  console.log(
    (document.getElementById("textbody") as HTMLTextAreaElement).value
  );
  renderMarkdown(
    document.getElementById("content"),
    (document.getElementById("textbody") as HTMLTextAreaElement).value
  );
}

function uploadText() {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    alert(this.responseText);
  };
  xhttp.open(
    "POST",
    "https://asia-southeast2-blog-raw.cloudfunctions.net/publishBlog",
    true
  );
  const password = (document.getElementById("password") as HTMLInputElement)
    .value;
  const codename = (document.getElementById("blogname") as HTMLInputElement)
    .value;
  const body = (document.getElementById("textbody") as HTMLInputElement).value;
  xhttp.send(JSON.stringify({ password, codename, body }));
}

const AdminPage = (
  <div className="fragment">
    <div className="submitbox">
      <input id="blogname" type="text" placeholder="Blog codename" />
      <input id="password" type="password" placeholder="Open Sesame!" />
      <button onClick={uploadText}>Publish</button>
    </div>
    <div className="twodivs">
      <div className="textdiv">
        <textarea id="textbody">
          Write something here . . . This will be rendered there . . .
        </textarea>
        <button onClick={renderText}>Render</button>
      </div>
      <div id="content"></div>
    </div>
  </div>
);

function afterRender() {
  // Credit: https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
  const tx = document.getElementsByTagName("textarea");
  for (let i = 0; i < tx.length; i++) {
    tx[i].setAttribute(
      "style",
      "height:" + tx[i].scrollHeight + "px;overflow-y:hidden;"
    );
    tx[i].addEventListener("input", OnInput, false);
  }

  function OnInput() {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name");
  if (name) {
    getDoc(doc(collection(db, "blog"), name))
      .then((doc) => {
        if (doc.exists) {
          (document.getElementById("textbody") as HTMLTextAreaElement).value =
            doc.data().body;
          OnInput.bind(document.getElementById("textbody"))();
        }
      })
      .catch((error) => {
        console.log("Error getting document:", error);
      });
  }
}

render(<AdminPage />, document.getElementById("root"));
document.addEventListener("DOMContentLoaded", function () {
  afterRender();
});
