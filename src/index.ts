import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  const token = core.getInput("github-token", { required: true });
  const client = new github.GitHub(token);
  const match_any = core.getInput("match-any", { required: false });

  const labelNames = await getPullRequestLabelNames(client);

  const labels = getInputLabels();

  let result = false;

  if(match_any === "true") {
    result = labels.some((label) => labelNames.includes(label));
  } else {
    result = labels.every((label) => labelNames.includes(label));
  }

  core.setOutput("result", result);
  core.setOutput("labels", labelNames);
}

async function getPullRequestLabelNames(
  client: github.GitHub
): Promise<string[]> {
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const commit_sha = github.context.sha;

  const response = await client.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha,
  });

  const pr = response.data.length > 0 && response.data[0];
  return pr ? pr.labels.map((label) => label.name) : [];
}

function getInputLabels(): string[] {
  const raw = core.getInput("labels", { required: true });
  const json = JSON.parse(raw);
  return Array.isArray(json) ? json : [];
}

run().catch((err) => {
  core.setFailed(err.message);
});
