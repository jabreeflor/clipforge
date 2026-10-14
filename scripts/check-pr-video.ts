const body = process.env.PR_BODY ?? "";
const VIDEO = /(github\.com\/user-attachments\/assets\/[\w-]+|\.(mp4|webm|mov)\b)/i;

if (!VIDEO.test(body)) {
  console.error("This PR has no video evidence. Add a video of the change working to the description (see AGENTS.md).");
  process.exit(1);
}
console.log("Video evidence found in the PR description.");
