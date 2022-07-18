import React from "react";
import dice from "./images/icon-dice.svg";
import dividermobile from "./images/pattern-divider-mobile.svg";
import divider from "./images/pattern-divider-desktop.svg";

export default function App() {
  return (
    <main className="container">
      <h1 className="main--title">Advice #117</h1>
      <blockquote>
        "It is easy to sit up and take notice whats hard is to bllahblaah blaah"
      </blockquote>
      <div className="divider--img">
        <img src={divider} alt="line" />
      </div>
      <button className="btn--advice">
        <img src={dice} alt="dice" />
      </button>
    </main>
  );
}
