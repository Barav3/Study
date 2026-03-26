import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

// ── STYLES ──────────────────────────────────────────────────────────────────
const _s = document.createElement("style");
_s.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{overflow-x:hidden; background: #060a14; color: #e8eaf0; font-family: "Inter", sans-serif;}
  .mode-card{transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; position:relative; overflow:hidden;}
  .mode-card:hover{transform:translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); border-color: var(--accent) !important;}
  .mc-btn{transition:all 0.2s; cursor:pointer; border:none;}
  .mc-btn:hover{filter:brightness(1.2); transform: scale(1.02);}
  .mc-btn:active{transform: scale(0.98);}
  @keyframes slideIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .slide-in{animation: slideIn 0.4s ease-out forwards;}
`;
document.head.appendChild(_s);

// ── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  "Midnight": { bg:"#060a14", card:"#0d1422", accent:"#d4a438", text:"#e8eaf0", border:"rgba(255,255,255,0.1)" },
  "Earth": { bg:"#140c06", card:"#221408", accent:"#e8a045", text:"#f5e8d0", border:"rgba(232,160,69,0.2)" },
  "Ocean": { bg:"#020c18", card:"#061628", accent:"#38bdf8", text:"#d8f0ff", border:"rgba(56,189,248,0.2)" }
};

// ── FULL PDF DATA ────────────────────────────────────────────────────────────
const DATA = {
  languages: [
    { id: "cha", name: "Chavacano", cat: "Creole", region: "Mindanao, Philippines", note: "Spanish-based creole on the West side of Mindanao", family: "Austronesian/Spanish" },
    { id: "srn", name: "Sranan Tongo", cat: "Creole", region: "Suriname", note: "English-based national lingua franca", family: "English-Creole" },
    { id: "pap", name: "Papiamento", cat: "Creole", region: "ABC Islands (Aruba, Bonaire, Curacao)", note: "Portuguese/Dutch/West African mix", family: "Portuguese-Creole" },
    { id: "gul", name: "Gullah-Geechee", cat: "Creole", region: "Coastal Georgia/Carolinas/Florida", note: "English + West African influences", family: "English-Creole" },
    { id: "hai", name: "Haitian Creole", cat: "Creole", region: "Haiti", note: "French and West Africa-based", family: "French-Creole" },
    { id: "tok", name: "Tok Pisin", cat: "Creole", region: "Papua New Guinea", note: "English-based bridge for 800+ languages", family: "English-Creole" },
    { id: "mal", name: "Maltese", cat: "Africa/Europe", region: "Malta", note: "Only Afro-Asiatic language in Europe", family: "Afro-Asiatic (Semitic)" },
    { id: "bas", name: "Basque", cat: "Exceptions", region: "Spain/France border", note: "Language isolate in Europe; survived Indo-European expansion", family: "Isolate" },
    { id: "ain", name: "Ainu", cat: "Exceptions", region: "Japan", note: "Indigenous isolate near extinction", family: "Isolate" },
    { id: "kor", name: "Korean", cat: "Exceptions", region: "Korea", note: "Koreanic family; often debated as an isolate", family: "Koreanic" },
    { id: "jej", name: "Jeju", cat: "Exceptions", region: "Jeju Island", note: "Spoken on island off the coast of Korea", family: "Koreanic" },
    { id: "esp", name: "Esperanto", cat: "Exceptions", region: "Global", note: "Lingua franca with NO native speakers", family: "Constructed" },
    { id: "hau", name: "Hausa", cat: "Africa", region: "Nigeria/Niger", note: "Chadic group; major trade language", family: "Afro-Asiatic" },
    { id: "swa", name: "Swahili", cat: "Africa", region: "East Africa", note: "Bantu-based lingua franca; Indian Ocean trade legacy", family: "Niger-Congo B" },
    { id: "zul", name: "Zulu", cat: "Africa", region: "South Africa", note: "Bantu; resisted colonial influence", family: "Niger-Congo B" },
    { id: "yor", name: "Yoruba", cat: "Africa", region: "West Africa", note: "Non-Bantu; Niger-Congo A", family: "Niger-Congo A" },
    { id: "ams", name: "Amharic", cat: "Africa", region: "Ethiopia", note: "Semitic lingua franca of Ethiopia", family: "Afro-Asiatic" }
  ],
  concepts: [
    { q: "What is it called when two or more languages combine through contact?", a: "Language Convergence" },
    { q: "What is it called when a single language splits into dialects and new languages?", a: "Language Divergence" },
    { q: "A simplified trade language, mix of 2 or more languages, is a:", a: "Pidgin" },
    { q: "An evolved pidgin that becomes a native language is a:", a: "Creole" },
    { q: "A bridge language used between different groups is a:", a: "Lingua Franca" },
    { q: "Why did Europeans give themselves power early on according to the doc?", a: "Domesticated the horse" },
    { q: "The place name derived from language is known as a:", a: "Toponym" }
  ]
};

// ── COMPONENTS ───────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState(THEMES.Midnight);
  const [view, setView] = useState("subject"); // subject, units, menu, quiz, map
  const [subView, setSubView] = useState("general"); // The 6 iterations

  const setAppTheme = (t) => setTheme(THEMES[t]);

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, "--accent": theme.accent }}>
      {/* Header */}
      <nav style={{ padding: "20px 40px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "Syne", letterSpacing: "-1px" }} onClick={() => setView("subject")}>CURRICULUM.OS</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {Object.keys(THEMES).map(t => (
            <button key={t} onClick={() => setAppTheme(t)} style={{ padding: "4px 12px", borderRadius: "20px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.text, cursor: "pointer", fontSize: "12px" }}>{t}</button>
          ))}
        </div>
      </nav>

      <main style={{ padding: "40px" }}>
        {view === "subject" && <SubjectSelection onSelect={() => setView("units")} theme={theme} />}
        {view === "units" && <UnitSelection onSelect={() => setView("menu")} theme={theme} />}
        {view === "menu" && <Menu onSelectQuiz={(mode) => { setSubView(mode); setView("quiz"); }} onSelectMap={() => setView("map")} theme={theme} />}
        {view === "quiz" && <QuizEngine mode={subView} theme={theme} onBack={() => setView("menu")} />}
        {view === "map" && <InteractiveMap theme={theme} onBack={() => setView("menu")} />}
      </main>
    </div>
  );
}

function SubjectSelection({ onSelect, theme }) {
  return (
    <div className="slide-in">
      <h1 style={{ fontFamily: "Syne", fontSize: "4rem", marginBottom: "40px" }}>Select Course</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div className="mode-card" onClick={onSelect} style={{ background: theme.card, padding: "40px", borderRadius: "24px", border: `1px solid ${theme.border}` }}>
          <h2 style={{ color: theme.accent }}>AP Human Geography</h2>
          <p style={{ marginTop: "10px", opacity: 0.7 }}>Full Unit 3 Language coverage.</p>
        </div>
        <div className="mode-card" style={{ background: theme.card, padding: "40px", borderRadius: "24px", border: `1px solid ${theme.border}`, opacity: 0.5, cursor: "not-allowed" }}>
          <h2>AP US History</h2>
          <p style={{ marginTop: "10px" }}>Locked.</p>
        </div>
      </div>
    </div>
  );
}

function UnitSelection({ onSelect, theme }) {
  return (
    <div className="slide-in">
      <h1 style={{ fontFamily: "Syne", fontSize: "3rem", marginBottom: "40px" }}>AP Human Geo / Units</h1>
      <div className="mode-card" onClick={onSelect} style={{ background: theme.card, padding: "30px", borderRadius: "20px", border: `1px solid ${theme.border}` }}>
        <h3>Unit 3: Cultural Patterns & Processes</h3>
        <p style={{ opacity: 0.7 }}>Language families, diffusion, and specific regional examples.</p>
      </div>
    </div>
  );
}

function Menu({ onSelectQuiz, onSelectMap, theme }) {
  const modes = [
    { id: "Africa", label: "Africa Focus" },
    { id: "AsiaEurope", label: "Asia & Europe" },
    { id: "Indigenous", label: "Indigenous" },
    { id: "Creole", label: "Creoles & Lingua Francas" },
    { id: "Exceptions", label: "Exceptions & Isolates" },
    { id: "Concepts", label: "Vocabulary & Concepts" }
  ];

  return (
    <div className="slide-in">
      <h2 style={{ marginBottom: "30px" }}>Select Quiz Iteration</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "40px" }}>
        {modes.map(m => (
          <button key={m.id} className="mc-btn" onClick={() => onSelectQuiz(m.id)} style={{ padding: "20px", background: theme.accent, color: "#000", fontWeight: "bold", borderRadius: "12px" }}>{m.label}</button>
        ))}
      </div>
      <div className="mode-card" onClick={onSelectMap} style={{ padding: "40px", background: theme.card, borderRadius: "20px", border: `1px solid ${theme.border}`, textAlign: "center" }}>
        <h2>Open Interactive Map</h2>
        <p>Zoom & Pan Regional Languages</p>
      </div>
    </div>
  );
}

function QuizEngine({ mode, theme, onBack }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isInfinite, setIsInfinite] = useState(false);
  const [limit, setLimit] = useState(20);

  const questions = useMemo(() => {
    let pool = [];
    if (mode === "Concepts") {
      pool = DATA.concepts.map(c => ({ q: c.q, a: c.a, options: shuffle([c.a, "Relocation Diffusion", "Hierarchical Diffusion", "Syncretism"]) }));
    } else {
      let filtered = DATA.languages.filter(l => mode === "All" || l.cat.includes(mode) || mode === "Creole" && l.cat === "Creole");
      pool = filtered.map(l => ({
        q: `Where is ${l.name} spoken and what is its role?`,
        a: `${l.region} - ${l.note}`,
        options: shuffle([`${l.region} - ${l.note}`, "Europe - A dead language", "South America - A colonial isolate", "Central Asia - A Turkic dialect"])
      }));
    }
    return shuffle(pool);
  }, [mode]);

  const handleAnswer = (ans) => {
    if (ans === questions[qIndex].a) setScore(score + 1);
    if (isInfinite) {
      setQIndex((qIndex + 1) % questions.length);
    } else {
      if (qIndex < limit - 1 && qIndex < questions.length - 1) setQIndex(qIndex + 1);
      else alert(`Quiz Finished! Score: ${score}/${limit}`);
    }
  };

  if (!questions.length) return <div>No questions for this mode yet. <button onClick={onBack}>Back</button></div>;

  return (
    <div className="slide-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={onBack} style={{ background: "none", color: theme.text, border: "none", cursor: "pointer" }}>← Back</button>
        <div>{score} pts</div>
      </div>
      <div style={{ background: theme.card, padding: "40px", borderRadius: "24px", border: `1px solid ${theme.border}` }}>
        <p style={{ opacity: 0.6, fontSize: "12px", marginBottom: "10px" }}>Question {qIndex + 1}</p>
        <h2 style={{ marginBottom: "30px" }}>{questions[qIndex].q}</h2>
        <div style={{ display: "grid", gap: "10px" }}>
          {questions[qIndex].options.map((opt, i) => (
            <button key={i} className="mc-btn" onClick={() => handleAnswer(opt)} style={{ padding: "15px", borderRadius: "10px", background: "#ffffff10", color: theme.text, textAlign: "left", border: `1px solid ${theme.border}` }}>{opt}</button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => setIsInfinite(!isInfinite)} style={{ opacity: isInfinite ? 1 : 0.5 }}>Infinite Mode: {isInfinite ? "ON" : "OFF"}</button>
      </div>
    </div>
  );
}

function InteractiveMap({ theme, onBack }) {
  const svgRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 500;

    const projection = d3.geoMercator().scale(120).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);
    const g = svg.append("g");

    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
      g.attr("transform", event.transform);
      setZoomLevel(event.transform.k);
    });

    svg.call(zoom);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(data => {
      g.selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#1a2234")
        .attr("stroke", theme.border);

      // Plot Language Markers
      const markers = [
        { long: 125, lat: 7, name: "Chavacano (West side Filipino)" },
        { long: -56, lat: 4, name: "Sranan Tongo" },
        { long: 14, lat: 35, name: "Maltese" }
      ];

      g.selectAll("circle")
        .data(markers)
        .enter().append("circle")
        .attr("cx", d => projection([d.long, d.lat])[0])
        .attr("cy", d => projection([d.long, d.lat])[1])
        .attr("r", 5 / zoomLevel)
        .attr("fill", theme.accent)
        .append("title").text(d => d.name);
    });
  }, [theme]);

  return (
    <div className="slide-in">
      <button onClick={onBack} style={{ marginBottom: "20px" }}>← Back</button>
      <div style={{ background: "#000", borderRadius: "20px", overflow: "hidden", border: `1px solid ${theme.border}` }}>
        <svg ref={svgRef} width="100%" height="500" viewBox="0 0 800 500"></svg>
      </div>
    </div>
  );
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
