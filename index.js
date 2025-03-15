require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const cors = require("cors");
const upload = require("express-fileupload");

// Initialize Express
const app = express();

app.use(cors({ origin: "*", credentials: true }));

// MongoDB User Model (Create a new file `User.js` in `models` folder)
const User = require("./models/User");
const auth = require("./middleWare/auth");
const { default: axios } = require("axios");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Passport GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://aidoc-production-8039.up.railway.app/auth/github/callback",
      scope: ["read:user", "public_repo", "user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          user = new User({
            githubId: profile.id,
            username: profile.username,
            avatar: profile.photos[0].value,
            email: profile.emails ? profile.emails[0].value : null,
            accessToken, // Store token to fetch repos later
          });
          await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        done(null, { user, token });
      } catch (err) {
        done(err, null);
      }
    }
  )
);

app.use(passport.initialize());
app.use(express.json());
app.use(upload());

// TEST
app.get("/", async (req, res) => {
  res.json({ msg: "Gotten successfully" });
});

// GitHub Auth Route
app.get("/auth/github", (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user,user:email`;
  res.json({ url: githubAuthUrl }); // Send URL instead of redirecting
});

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const { user, token } = req.user;
    res.redirect(`https://aidoc-doc.netlify.app/sign?token=${token}`);
  }
);

// Fetch GitHub Repositories
app.get("/api/repos", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const reposResponse = await axios.get(
      "https://api.github.com/user/repos?visibility=public",
      {
        headers: { Authorization: `token ${user.accessToken}` },
      }
    );
    // console.log(reposResponse.data);

    const repos = await reposResponse.data;

    // Filter only repositories owned by the user (exclude organizations or others)
    const filteredRepos = repos
      .filter((repo) => repo.owner.login === user.username) // Replace `githubUsername` with the actual username field
      .map((repo) => ({
        label: repo.name,
        value: repo.html_url,
      }));

    res.json(filteredRepos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
// GET BRANCH
app.get("/api/repobranch", auth, async (req, res) => {
  try {
    const { githubUrl } = req.query; // ✅ Extract from query instead of body
    const filteredUrl = githubUrl.toString().split("/");
    console.log(filteredUrl);

    const owner = filteredUrl[filteredUrl.length - 2]; // Gets the second-to-last part
    const repo = filteredUrl[filteredUrl.length - 1]; // Gets the second-to-last part
    console.log(repo, owner);
    console.log(`https://api.github.com/repos/${owner}/${repo}/branches`);

    const user = await User.findById(req.user.id);

    if (!user) return res.status(401).json({ error: "Unauthorized" });
    console.log(`${githubUrl}/branches`);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "User-Agent": "Code-to-Doc-AI",
        },
      }
    );
    const branches = response.data.map((branch) => ({
      label: branch.name,
      value: branch.name,
    }));
    res.json(branches);
  } catch (err) {
    console.error("Error fetching branches:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET USER
app.get("/api/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, 'avatar dailyUsage username totalUsage');

    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    // Send only the selected fields
    res.json({
      avatar: user.avatar,
      dailyUsage: user.dailyUsage,
      username: user.username,
      totalUsage: user.totalUsage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
// ROUTES
app.use("/api/docs", require("./routes/docs"));

app.listen(5000, () => console.log("Server running on port 5000"));
