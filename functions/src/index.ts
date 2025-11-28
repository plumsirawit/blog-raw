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
    // Restrict CORS to specific domains
    const allowedOrigins = [
      "https://blog.plummmm.com",
      "http://localhost:5000",
      "http://localhost:3000",
    ];
    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }

    // Parse JSON with error handling
    let parsedBody;
    try {
      parsedBody = JSON.parse(request.body);
    } catch (e) {
      response.status(400).send({ error: "Invalid JSON" });
      return;
    }

    const bodyDecoded = PublishBlogRequestPayload.decode(parsedBody);
    if (isLeft(bodyDecoded)) {
      // Don't log sensitive request body
      functions.logger.warn("Bad request: invalid payload structure");
      response.status(400).send({ error: "bad request" });
      return;
    }
    const { codename, body, password } = bodyDecoded.right;

    // Validate codename to prevent path traversal and injection
    if (!/^[a-zA-Z0-9_-]+$/.test(codename)) {
      response.status(400).send({ error: "Invalid codename format" });
      return;
    }

    // Limit codename length
    if (codename.length > 100) {
      response.status(400).send({ error: "Codename too long" });
      return;
    }

    const test = await compare(password, HASHED_SECRET_PASSWORD);
    if (!test) {
      // Don't log password attempts
      functions.logger.warn("Authentication failed");
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
  .firestore.document("blog/{blogId}")
  .onWrite(innerListenWrite);

/* For testing purposes only.

export const triggerListenWrite = functions
  .region("asia-southeast2")
  .https.onRequest(async (_, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    await innerListenWrite();
    response.send("OK");
  });
*/
