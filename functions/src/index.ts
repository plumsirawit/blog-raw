import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
if (admin.apps.length == 0) admin.initializeApp();
const firestore = admin.firestore();
import * as t from "io-ts";
import { isLeft } from "fp-ts/lib/Either";
import { HASHED_SECRET_PASSWORD } from "./password";
import { compare } from "bcrypt";
import { innerListenWrite } from "./listenWrite";

const PublishBlogRequestPayload = t.type({
  codename: t.string,
  body: t.string,
  password: t.string,
});

// const BlogData = t.type({
//   body: t.string,
//   currentVersion: t.number,
//   currentTimestamp: t.number,
// });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const publishBlog = functions
  .region("asia-southeast2")
  .https.onRequest(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    const bodyDecoded = PublishBlogRequestPayload.decode(
      JSON.parse(request.body)
    );
    if (isLeft(bodyDecoded)) {
      console.log("bad request", request.body);
      response.status(400).send({ error: "bad request" });
      return;
    }
    const { codename, body, password } = bodyDecoded.right;
    const test = await compare(password, HASHED_SECRET_PASSWORD);
    if (!test) {
      console.log("wrong password");
      response.status(403).send({ error: "wrong password" });
      return;
    }
    const docSnapshot = await firestore.collection("blog").doc(codename).get();
    let newVersion = 1;
    if (docSnapshot.data()) {
      const {
        body: oldBody,
        lang,
        currentVersion,
        currentTimestamp,
      } = docSnapshot.data() as any; // bad hack but fast
      await firestore
        .collection("blog")
        .doc(codename)
        .collection("revisions")
        .doc(currentVersion.toString())
        .set({
          timestamp: currentTimestamp,
          body: oldBody,
          lang,
        });
      newVersion = currentVersion + 1;
    }
    await firestore.collection("blog").doc(codename).set({
      body,
      lang: "Thai",
      currentVersion: newVersion,
      currentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    response.status(200).send("ok");
  });

export const listenWrite = functions
  .region("asia-southeast2")
  .runWith({
    timeoutSeconds: 60,
    memory: "1GB",
  })
  .firestore.document("blog/{blogId}")
  .onWrite(innerListenWrite);

export const triggerListenWrite = functions
  .region("asia-southeast2")
  .runWith({
    timeoutSeconds: 60,
    memory: "1GB",
  })
  .https.onRequest(async (_, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    await innerListenWrite();
    response.send("OK");
  });
