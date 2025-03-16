import { toast } from "react-toastify";


export const style = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--text)",
      height: "45px",
      color: "var(--bg)",
      borderColor: "var(--bg)",
      outline: "none",
      border: "none",
      borderStyle: "dotted",
    }),
    singleValue: (provided) => ({ ...provided, color: "var(--bg)" }),
    menu: (provided) => ({ ...provided, backgroundColor: "var(--text)" }),
    input: (provided) => ({
      ...provided,
      color: "var(--bg)", // Ensures typed input bg color
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--bg)", // Ensures placeholder bg color
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "var(--text)" : "var(--text)",
      color: "var(--bg)",
      "&:hover": { backgroundColor: "var(--text)" },
    }),
  };

export const errorMsgs = (e) =>
  toast(e, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    type: "error",
    theme: "dark",
  });
export const successMsg = (e) =>
  toast(e, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    type: "success",
    theme: "dark",
  });
