#!/usr/bin/env node

import crypto from "node:crypto";
import http from "node:http";
import process from "node:process";
import { spawn } from "node:child_process";
import { google } from "googleapis";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const CALLBACK_PATH = "/oauth2callback";
const HOST = "127.0.0.1";
const TIMEOUT_MS = 10 * 60 * 1000;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function openBrowser(url) {
  const commands = {
    darwin: ["open", [url]],
    win32: ["cmd", ["/c", "start", "", url]],
    linux: ["xdg-open", [url]],
  };
  const command = commands[process.platform];

  if (!command) return false;

  try {
    const child = spawn(command[0], command[1], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, () => resolve(server.address()));
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    fail("GOOGLE_CLIENT_ID is required.");
    return;
  }

  if (!clientSecret) {
    fail("GOOGLE_CLIENT_SECRET is required. It was not printed.");
    return;
  }

  const state = crypto.randomBytes(24).toString("hex");
  let oauth2Client;
  let timeout;

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", `http://${HOST}`);

      if (requestUrl.pathname !== CALLBACK_PATH) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      if (requestUrl.searchParams.get("state") !== state) {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
        response.end("Invalid OAuth state. You can close this tab.");
        fail("OAuth callback state did not match.");
        await closeServer(server);
        return;
      }

      const error = requestUrl.searchParams.get("error");
      if (error) {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
        response.end("Google authorization was not completed. You can close this tab.");
        fail(`Google returned OAuth error: ${error}`);
        await closeServer(server);
        return;
      }

      const code = requestUrl.searchParams.get("code");
      if (!code) {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
        response.end("Missing authorization code. You can close this tab.");
        fail("OAuth callback did not include an authorization code.");
        await closeServer(server);
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);

      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Softbade Sheets Auth</title><p>Authorization complete. You can return to the terminal.</p>");

      if (!tokens.refresh_token) {
        fail("Google did not return a refresh token. Re-run this helper and approve access with the same account, or revoke the app grant and try again.");
      } else {
        console.log("");
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      }

      clearTimeout(timeout);
      await closeServer(server);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("OAuth token exchange failed. You can close this tab.");
      fail(error instanceof Error ? error.message : String(error));
      clearTimeout(timeout);
      await closeServer(server);
    }
  });

  const address = await listen(server);
  const redirectUri = `http://${HOST}:${address.port}${CALLBACK_PATH}`;
  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [SCOPE],
    state,
  });

  timeout = setTimeout(async () => {
    fail("Timed out waiting for Google OAuth callback.");
    await closeServer(server);
  }, TIMEOUT_MS);

  console.log("Google Sheets OAuth helper");
  console.log(`Callback server: ${redirectUri}`);
  console.log("Requested scope:");
  console.log(SCOPE);
  console.log("");
  console.log("Authorization URL:");
  console.log(authorizationUrl);

  if (openBrowser(authorizationUrl)) {
    console.log("");
    console.log("Opened the authorization URL in your browser.");
  } else {
    console.log("");
    console.log("Open the authorization URL above in your browser.");
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
