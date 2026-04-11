import {
  buildCommitMessage,
  clearDraft,
  serializeCalendarData,
} from "./data.mjs";
import { safeReadJson } from "./utils.mjs";

export async function publishChanges({ state, render, setStatus, openSettingsModal }) {
  if (state.syncPending) {
    return;
  }

  if (!state.dirty) {
    setStatus("No local draft changes to publish.");
    return;
  }

  const missingSettings = getMissingGithubSettings(state.githubSettings);
  if (missingSettings.length) {
    setStatus(`GitHub settings missing: ${missingSettings.join(", ")}.`);
    openSettingsModal();
    return;
  }

  state.data.updatedAt = new Date().toISOString();
  const payload = serializeCalendarData(state.data);
  const commitMessage = buildCommitMessage(state.data);

  state.syncPending = true;
  render();
  setStatus(
    state.githubSettings.commitMode === "contents"
      ? "Publishing JSON through the GitHub contents API..."
      : "Triggering GitHub Actions to commit the JSON update...",
  );

  try {
    if (state.githubSettings.commitMode === "contents") {
      await publishViaContentsApi(state.githubSettings, payload, commitMessage);
    } else {
      await publishViaActions(state.githubSettings, payload, commitMessage);
    }

    clearDraft(state);
    render();
    setStatus("Publish request completed. GitHub now has the latest JSON payload.");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "GitHub publish failed.");
  } finally {
    state.syncPending = false;
    render();
  }
}

async function publishViaActions(settings, payload, commitMessage) {
  const response = await githubApi(
    settings,
    `/repos/${settings.owner}/${settings.repo}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({
        event_type: settings.dispatchEventType,
        client_payload: {
          data: payload,
          path: settings.dataPath,
          branch: settings.branch,
          commit_message: commitMessage,
        },
      }),
    },
  );

  if (response.status !== 204) {
    const body = await safeReadJson(response);
    throw new Error(body?.message || `Failed to trigger GitHub Actions: ${response.status}`);
  }
}

async function publishViaContentsApi(settings, payload, commitMessage) {
  const encodedPath = encodeURIComponent(settings.dataPath).replace(/%2F/g, "/");
  const existingResponse = await githubApi(
    settings,
    `/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}?ref=${encodeURIComponent(settings.branch)}`,
  );

  let sha = null;
  if (existingResponse.status === 200) {
    const existing = await existingResponse.json();
    sha = existing.sha || null;
  } else if (existingResponse.status !== 404) {
    const body = await safeReadJson(existingResponse);
    throw new Error(body?.message || `Failed to read current file: ${existingResponse.status}`);
  }

  const updateResponse = await githubApi(
    settings,
    `/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: commitMessage,
        content: payload,
        branch: settings.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  if (!updateResponse.ok) {
    const body = await safeReadJson(updateResponse);
    throw new Error(body?.message || `Failed to update repository file: ${updateResponse.status}`);
  }
}

function githubApi(settings, path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
    body: options.body,
  });
}

function getMissingGithubSettings(settings) {
  const missing = [];

  if (!settings.owner) {
    missing.push("owner");
  }
  if (!settings.repo) {
    missing.push("repo");
  }
  if (!settings.branch) {
    missing.push("branch");
  }
  if (!settings.dataPath) {
    missing.push("data path");
  }
  if (!settings.token) {
    missing.push("token");
  }
  if (settings.commitMode === "actions" && !settings.dispatchEventType) {
    missing.push("dispatch event type");
  }

  return missing;
}
