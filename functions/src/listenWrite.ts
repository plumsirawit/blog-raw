import fetch from "node-fetch";
import { GITHUB_ACCESS_TOKEN } from "./password";
export const innerListenWrite = (): Promise<unknown> =>
  fetch("https://api.github.com/repos/plumsirawit/blog-raw/dispatches", {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_ACCESS_TOKEN}`,
    },
    body: "{\"event_type\":\"gen\"}",
    method: "post",
  });
