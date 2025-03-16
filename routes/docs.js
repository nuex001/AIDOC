const express = require("express");
const { urlencoded } = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const { Anthropic } = require("@anthropic-ai/sdk");
const moment = require("moment");
//MIDDLEWARE
const auth = require("../middleWare/auth");

// SCHEMA
const User = require("../models/User");

//
function summarizeContent(content) {
  // Ensure content is a string to avoid TypeError
  if (typeof content !== "string") {
    console.error("Error: Content is not a valid string", content);
    return;
  }

  // If content is short, return as is
  if (content.length <= 5000) return content;
  console.log(content);

  // Extract first 5000 chars, last 5000 chars, and unique functions/classes
  const firstPart = content.slice(0, 5000);
  const lastPart = content.slice(-5000);

  const functionMatches = [...content.matchAll(/(function|class)\s+(\w+)/g)];
  const functionList = functionMatches.map((match) => match[0]).join("\n");

  return `
    **Summary of File**
    - Important functions & classes: 
    ${functionList || "[No functions found]"}
    
    - Beginning of File: 
    ${firstPart}
    
    - End of File: 
    ${lastPart}
    `;
}

// Function to fetch files from GitHub
async function fetchGitHubRepo(owner, repo, path = "", branch = null) {
  console.log(branch);
  console.log(path);

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${
    branch ? `?ref=${branch}` : ""
  }`;
  console.log(apiUrl);

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, // Use if accessing private repos
        "User-Agent": "Code-to-Doc-AI",
      },
    });

    let allFiles = [];

    for (const file of response.data) {
      if (file.type === "file") {
        allFiles.push(file); // Add files to the list
      } else if (file.type === "dir") {
        // Recursive call to get files inside subdirectories
        const nestedFiles = await fetchGitHubRepo(owner, repo, file.path);
        allFiles = allFiles.concat(nestedFiles);
      }
    }

    return allFiles;
  } catch (error) {
    console.error("GitHub Fetch Error:", error.message);
    return [];
  }
}

// Function to extract React & Solidity files
async function processGitHubRepo(owner, repo, branch) {
  const files = await fetchGitHubRepo(owner, repo, "", branch);
  if (!files) return { backendFiles: [], frontendFiles: [] };

  const backendFiles = [];
  const frontendFiles = [];

  for (const file of files) {
    const fileContent = await axios.get(file.download_url);
    let content = fileContent.data;

    // Summarize if the file is too long
    content = summarizeContent(content);

    if (
      file.name.endsWith(".js") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".html")
    ) {
      frontendFiles.push({ filename: file.path, content });
    } else if (
      file.name.endsWith(".ts") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".go") ||
      file.name.endsWith(".sol") ||
      file.name.endsWith(".java") ||
      file.name.endsWith(".php") ||
      file.name.endsWith(".rb")
    ) {
      backendFiles.push({ filename: file.path, content });
    }
  }

  return { backendFiles, frontendFiles };
}

// API Route: Generate Documentation from PROMPT
router.post("/generate-promt", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Get the current date (YYYY-MM-DD)
  const today = moment().format("YYYY-MM-DD");
  const lastUpdated = moment(user.updatedAt).format("YYYY-MM-DD");

  if (today === lastUpdated) {
    // If it's the same day, check daily usage
    if (user.dailyUsage < 3) {
      user.dailyUsage += 1;
      user.totalUsage += 1;
    } else {
      console.log("Daily limit reached.");
      return res.status(401).json({ error: "Daily limit reached." }); // Stop execution
    }
  } else {
    // It's a new day, reset dailyUsage
    user.dailyUsage = 1;
    user.totalUsage += 1;
  }

  const { promptMsg } = req.body; // Default to 'main' branch
  if (!promptMsg)
    return res.status(400).json({ error: "Prompt Msg is required." });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    let documentation = [];

    const prompt = `**Project Documentation Request -
          Need a detailed documentation for the following files:\n\n
          Please create professional documentation for the following files that follows these requirements:
1. Use proper markdown formatting compatible with GitHub READMEs
2. For each file, include:
   - File name as a heading
   - Brief description of purpose
   - Explanation of key functions/components
   - Any dependencies or connections to other project files
3. Format code snippets with proper syntax highlighting using \`\`\` blocks
4. Structure the content with clear headings and bullet points
5. Keep explanations concise and developer-focused

Here are the files to document:
          ${promptMsg}
            Return only the formatted documentation without any conversation or extra text.
          `;

    const msg = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 5000,
      temperature: 1,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    });

    documentation.push(msg.content[0].text);

    // Save the updated user
    await user.save();
    res.json({ documentation: documentation.join("\n\n") });
  } catch (error) {
    console.error("Error generating documentation:", c);
    res.status(500).json({ error: err.message });
  }
});

// API Route: Generate Documentation GITHUB
router.post("/generate-doc", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Get the current date (YYYY-MM-DD)
  const today = moment().format("YYYY-MM-DD");
  const lastUpdated = moment(user.updatedAt).format("YYYY-MM-DD");

  if (today === lastUpdated) {
    // If it's the same day, check daily usage
    if (user.dailyUsage < 3) {
      user.dailyUsage += 1;
      user.totalUsage += 1;
    } else {
      console.log("Daily limit reached.");
      return res.status(500).json({ error: "Daily limit reached." }); // Stop execution
    }
  } else {
    // It's a new day, reset dailyUsage
    user.dailyUsage = 1;
    user.totalUsage += 1;
  }

  const { githubUrl, branch } = req.body; // Default to 'main' branch
  if (!githubUrl)
    return res.status(400).json({ error: "GitHub URL is required." });

  const [_, owner, repo] =
    githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || [];
  if (!owner || !repo)
    return res.status(400).json({ error: "Invalid GitHub URL format." });

  try {
    const { backendFiles, frontendFiles } = await processGitHubRepo(
      owner,
      repo,
      branch // Pass the branch to the GitHub processing function
    );

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    let documentation = [];

    async function sendToAI(files, category) {
      for (let i = 0; i < files.length; i += 5) {
        const batch = files.slice(i, i + 5);
        const prompt = `**Project README Generation Request ${category}**

Please create a professional README.md file for my project that follows these requirements:
1. Use proper GitHub-compatible markdown formatting
2. Include:
   - Project title and description
   - Installation instructions
   - Usage examples
   - Main features
   - Dependencies
   - Contributing guidelines (if applicable)
   - License information
3. Format code snippets with proper syntax highlighting
4. Structure the content with clear headings
5. Keep explanations concise and developer-focused

Here are the details about my project:
          ${batch
            .map((f) => `### ${f.filename} ###\n${f.content}`)
            .join("\n\n")}
            Return only the formatted documentation without any conversation or extra text.
          `;

        const msg = await anthropic.messages.create({
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 5000,
          temperature: 1,
          messages: [
            { role: "user", content: [{ type: "text", text: prompt }] },
          ],
        });

        documentation.push(msg.content[0].text);
      }
    }

    await sendToAI(frontendFiles, "Frontend Code");
    await sendToAI(backendFiles, "Backend Code");

    // Save the updated user
    await user.save();
    res.json({ documentation: documentation.join("\n\n") });
  } catch (error) {
    console.error("Error generating documentation:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
