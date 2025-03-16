import React, { useEffect, useRef, useState } from "react";
import "../../assets/css/home.css";
import Select from "react-select";
import axios from "axios";
import { style } from "../../utils/utils";
import PromptCont from "../layouts/Home.jsx/PromptCont";
import Subnav from "../layouts/Home.jsx/Subnav";
import { errorMsgs, successMsg } from "../../utils/utils";
import { ToastContainer } from "react-toastify";

function Home() {
  const promptMsgRef = useRef(null);
  const [sectionStage, setSectionStage] = useState(0);
  const [githubRepos, setGithubRepos] = useState(null);
  const [githubUrl, setGithubUrl] = useState(null);
  const [githubRepoBranches, setGithubRepoBranches] = useState(null);
  const [githubRepoBranch, setGithubRepoBranch] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [generatingCode, setgeneratingCode] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const setSectionStageFunc = (e) => {
    setSectionStage(Number(e.target.getAttribute("data-index")));
  };

  const setTextAreaFunc = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    const maxHeight = parseInt(getComputedStyle(textarea).maxHeight);

    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  };

  // FETCH GENERAL ALL REPOS
  const fetchReposFunc = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/repos`
      );
      // console.log("API Response:", response.data);
      setGithubRepos(response.data);
    } catch (error) {
      const err = error?.response?.data.msg;
      console.error("Error fetching repos:", error?.response?.data.msg);
    }
  };

  // FETCH GENERAL ALL BRANCHS
  const selectRepoFunc = async (selectedOption) => {
    // console.log(selectedOption);
    try {
      setGithubUrl(selectedOption.value);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/repobranch`,
        {
          params: { githubUrl: selectedOption.value }, // ✅ Pass as query params
        }
      );
      setGithubRepoBranches(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // SAVE SELECTED BRANCH
  const selectRepoBranchFunc = async (selectedOption) => {
    console.log(selectedOption);
    try {
      setGithubRepoBranch(selectedOption.value);
    } catch (error) {
      console.log(error);
    }
  };

  // GENERATE FUNCTION
  const GenerateFunc = async (e) => {
    e.preventDefault();
    console.log(githubUrl, githubRepoBranch);

    try {
      setOpenModal(true);
      setgeneratingCode(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/generate-doc`,
        {
          githubUrl: githubUrl,
          branch: githubRepoBranch,
        }
      );
      console.log("API Response:", response.data);
      setDocumentation(response?.data?.documentation);
      setgeneratingCode(false);
    } catch (error) {
      const err = error?.response?.data.error;
      errorMsgs(err);
      setOpenModal(false);
      console.error("Error fetching repos:", error?.response?.data.error);
    }
  };

  // GENERATE FUNCTION PROMPT
  const GeneratePromptFunc = async (event) => {
    try {
      setOpenModal(true);
      setgeneratingCode(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/generate-promt`,
        {
          promptMsg: event.target.value,
        }
      );
      console.log("API Response:", response.data);
      setDocumentation(response?.data?.documentation);
      setgeneratingCode(false);
    } catch (error) {
      const err = error?.response?.data.error;
      errorMsgs(err);
      setOpenModal(false);
      console.error("Error fetching repos:", error?.response?.data.error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents the default action (e.g., adding a newline in the textarea)
      // Call your function here
      console.log("cliked enter");

      GeneratePromptFunc(event);
    }
  };

  useEffect(() => {
    fetchReposFunc();
  }, []); // No dependency array needed since no external dependencies

  return (
    <div className="home">
      <ToastContainer />
      <Subnav />
      <div className="child">
        <main>
          <ul>
            <li
              className={sectionStage === 0 ? "active" : ""}
              onClick={setSectionStageFunc}
              data-index="0"
            >
              Code
            </li>
            <li
              className={sectionStage === 1 ? "active" : ""}
              onClick={setSectionStageFunc}
              data-index="1"
            >
              Github
            </li>
          </ul>
          {sectionStage === 0 ? (
            <textarea
              name="promptMsg"
              id="promptMsg"
              placeholder="Paste Raw Code and generate Docs"
              ref={promptMsgRef}
              onInput={setTextAreaFunc}
              onKeyDown={handleKeyDown}
            ></textarea>
          ) : (
            <div className="gitCont">
              <form>
                <Select
                  options={githubRepos}
                  className="selectInput"
                  styles={style}
                  name="gitRepo"
                  onChange={selectRepoFunc}
                  placeholder="- SELECT REPO -"
                />
                <Select
                  options={githubRepoBranches}
                  className="selectInput"
                  styles={style}
                  name="gitBranch"
                  onChange={selectRepoBranchFunc}
                  placeholder="- SELECT BRANCH -"
                />
                <button
                  className={githubRepoBranch ? "active" : ""}
                  onClick={GenerateFunc}
                >
                  Generate Docs
                </button>
              </form>
            </div>
          )}
        </main>
        <div className={openModal ? "promptCont active" : "promptCont"}>
          <PromptCont
            documentation={documentation}
            generatingCode={generatingCode}
            setOpenModal={setOpenModal}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
