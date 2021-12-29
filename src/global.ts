import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyDibwSzyUfnxK3k9_ZGPukPbdNgyePGT98",
  authDomain: "blog-raw.firebaseapp.com",
  projectId: "blog-raw",
  storageBucket: "blog-raw.appspot.com",
  messagingSenderId: "935368739139",
  appId: "1:935368739139:web:bf30fa950e8d25542fc7f6",
  measurementId: "G-675GPZY3NP",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { renderMarkdown } from "./utils/render";
export { collection, doc, getDoc } from "firebase/firestore/lite";
