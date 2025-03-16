import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaCopy, FaCheck, FaFileDownload } from "react-icons/fa";

const PromptCont = ({ documentation, generatingCode, setOpenModal }) => {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState({});
  const [wholeCopySuccess, setWholeCopySuccess] = useState(false);
  const typingSpeed = 5; // Characters per typing iteration
  const containerRef = useRef(null);

  useEffect(() => {
    if (index < documentation?.length) {
      const timer = setTimeout(() => {
        setDisplayText(documentation.substring(0, index + typingSpeed));
        setIndex(index + typingSpeed);
      }, 10); // Adjust timing for faster/slower typing

      return () => clearTimeout(timer);
    }
  }, [index, documentation, generatingCode]);

  useEffect(() => {
    if (generatingCode) {
      setDisplayText(""); // Reset the displayed text
      setIndex(0);
    }
  }, [generatingCode]);

  useEffect(() => {
    if (containerRef.current) {
      // Auto-scroll to bottom smoothly during typing
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayText]);

  // Copy to clipboard function for code blocks
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Set success state for this specific code block
        setCopySuccess((prev) => ({ ...prev, [id]: true }));

        // Reset success message after 2 seconds
        setTimeout(() => {
          setCopySuccess((prev) => ({ ...prev, [id]: false }));
        }, 2000);
      },
      () => {
        console.error("Failed to copy text");
      }
    );
  };

  // Copy entire documentation
  const copyEntireDoc = () => {
    navigator.clipboard.writeText(documentation).then(
      () => {
        setWholeCopySuccess(true);
        setTimeout(() => {
          setWholeCopySuccess(false);
        }, 2000);
      },
      () => {
        console.error("Failed to copy entire documentation");
      }
    );
  };

  // Download documentation as markdown
  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([documentation], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = "documentation.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Language mapping function with expanded support
  const getLanguage = (language) => {
    const languageMap = {
      // JavaScript family
      js: "javascript",
      javascript: "javascript",
      jsx: "jsx",
      ts: "typescript",
      typescript: "typescript",
      tsx: "tsx",

      // Web markup/styling
      html: "markup",
      xml: "markup",
      svg: "markup",
      css: "css",
      scss: "scss",
      sass: "scss",
      less: "less",

      // Backend languages
      python: "python",
      py: "python",
      rb: "ruby",
      ruby: "ruby",
      php: "php",
      go: "go",
      rust: "rust",
      java: "java",
      c: "c",
      cpp: "cpp",
      "c++": "cpp",
      csharp: "csharp",
      cs: "csharp",
      swift: "swift",
      kotlin: "kotlin",

      // Shell/scripting
      bash: "bash",
      sh: "bash",
      shell: "bash",
      powershell: "powershell",

      // Data formats
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      toml: "toml",

      // Blockchain
      solidity: "javascript", // Fallback for Solidity
      sol: "javascript",

      // Database
      sql: "sql",
      mysql: "sql",
      postgresql: "sql",
      postgres: "sql",
      mongodb: "javascript",

      // Config files
      ini: "ini",
      conf: "ini",
      docker: "docker",
      dockerfile: "docker",

      // Other
      markdown: "markdown",
      md: "markdown",
      diff: "diff",
      graphql: "graphql",
      gql: "graphql",
    };

    return languageMap[language?.toLowerCase()] || language || "text";
  };

  if (!documentation) {
    return (
      <div className="documentation-viewer empty-state">
        <h2 className="h2">
          Turn Your Code into Clear, Structured Docs in Seconds!
        </h2>
        {generatingCode ? (
          <p>documentating........</p>
        ) : (
          <p>
            Enter a detailed prompt to create comprehensive documentation for
            your project.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="documentation-viewer">
      <div className="doc-header">
        <div className="window-controls">
          <span
            className="window-control close"
            onClick={() => {
              setOpenModal(false);
            }}
          ></span>
          <span className="window-control minimize"></span>
          <span className="window-control maximize"></span>
        </div>
        <div className="title-bar">
          <span>Project Documentation</span>
          <div className="document-actions">
            <button
              className="action-button copy-all-button"
              onClick={copyEntireDoc}
              title="Copy entire documentation"
            >
              {wholeCopySuccess ? <FaCheck /> : <FaCopy />}
              <span>{wholeCopySuccess ? "Copied!" : "Copy All"}</span>
            </button>
            <button
              className="action-button download-button"
              onClick={downloadMarkdown}
              title="Download as markdown"
            >
              <FaFileDownload />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
      <div className="content-container" ref={containerRef}>
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeId = Math.random().toString(36).substring(2, 9);

                return !inline && match ? (
                  <div className="code-block-wrapper">
                    <div className="code-block-header">
                      <span className="code-language">{match[1]}</span>
                      <button
                        className="copy-button"
                        onClick={() =>
                          copyToClipboard(
                            String(children).replace(/\n$/, ""),
                            codeId
                          )
                        }
                        title="Copy code"
                      >
                        {copySuccess[codeId] ? <FaCheck /> : <FaCopy />}
                        <span>{copySuccess[codeId] ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={getLanguage(match[1])}
                      PreTag="div"
                      showLineNumbers={true}
                      wrapLines={true}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code {...props}>{children}</code>
                );
              },
            }}
          >
            {displayText}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PromptCont;
