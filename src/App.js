import React, { useEffect } from "react";
import axios from "axios";
import Footer from "./components/Footer";
import dice from "./images/icon-dice.svg";
import dividermobile from "./images/pattern-divider-mobile.svg";
import divider from "./images/pattern-divider-desktop.svg";

export default function App() {
  // Changing the divider image as per teh screen width dynamically
  const [width, setWidth] = React.useState(window.innerWidth);
  const updateDimensions = () => {
    setWidth(window.innerWidth);
  };

  // Get Advices

  let url = "https://api.adviceslip.com/advice";

  const [advice, setAdvice] = React.useState({});

  const fetchData = async () => {
    await axios.get(url).then((res) => {
      console.log(res.data.slip);
      setAdvice(res.data.slip);
      return res.data.slip;
    });
  };

  // let initAdvice = fetchData();
  // console.log(initAdvice);

  useEffect(() => {
    window.addEventListener("resize", updateDimensions);
    setAdvice(fetchData());
  }, []);

  const getAdvice = () => {
    fetchData();
    console.log(advice);
  };

  return (
    <>
      <main className="container">
        <h1 className="main--title">Advice #{advice.id}</h1>
        <blockquote>{advice.advice && `" ${advice.advice} "`}</blockquote>
        <div className="divider--img">
          <img src={width >= 580 ? divider : dividermobile} alt="dividerline" />
        </div>
        <button onClick={getAdvice} className="btn--advice">
          <img src={dice} alt="dice" />
        </button>
      </main>
      <Footer />
    </>
  );
}
