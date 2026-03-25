import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// Inject fonts and base CSS
const _fs = document.createElement("style");
_fs.textContent = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,900;1,400&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:6px;background:rgba(0,0,0,0.2);}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:3px;}
.flip-card{perspective:1000px;cursor:pointer;}
.flip-inner{position:relative;width:100%;height:100%;transition:transform 0.6s;transform-style:preserve-3d;}
.flip-inner.flipped{transform:rotateY(180deg);}
.flip-front,.flip-back{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px;}
.flip-back{transform:rotateY(180deg);}
.mode-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 40px rgba(0,0,0,0.4)!important;}
.mode-card{transition:transform 0.2s, box-shadow 0.2s;}
.tree-item:hover{background:rgba(255,255,255,0.05)!important;}
.quiz-opt:hover{background:rgba(255,255,255,0.1)!important;}
.quiz-opt{transition:all 0.15s;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeIn 0.3s ease forwards;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
.pulse{animation:pulse 1.5s infinite;}`;
document.head.appendChild(_fs);

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  midnight: { name: "Midnight Gold", bg:"#080c18", card:"#0f1628", card2:"#161f38", primary:"#d4a438", primaryLight:"#f0c060", text:"#e8eaf0", muted:"#7a84a0", border:"rgba(255,255,255,0.07)", ff:'"Playfair Display", serif', fb:'"Outfit", sans-serif' },
  forest:   { name: "Deep Forest", bg:"#0a120a", card:"#101a10", card2:"#162416", primary:"#a3e635", primaryLight:"#d9f99d", text:"#f0fdf4", muted:"#86efac", border:"rgba(255,255,255,0.07)", ff:'"Playfair Display", serif', fb:'"Outfit", sans-serif' },
  ocean:    { name: "Oceanic Blue", bg:"#0f172a", card:"#1e293b", card2:"#334155", primary:"#38bdf8", primaryLight:"#7dd3fc", text:"#f8fafc", muted:"#94a3b8", border:"rgba(255,255,255,0.1)", ff:'"Playfair Display", serif', fb:'"Outfit", sans-serif' }
};

const FC = {
  "Indo-European":"#4e91f7", "Sino-Tibetan":"#f87171", "Afro-Asiatic":"#fbbf24",
  "Niger-Congo":"#34d399", "Austronesian":"#a78bfa", "Turkic":"#fb923c",
  "Dravidian":"#f472b6", "Japonic":"#2dd4bf", "Koreanic":"#818cf8",
  "Uralic":"#a3e635", "Caucasian":"#e879f9", "Austro-Asiatic":"#38bdf8",
  "Tai-Kadai":"#86efac", "Nilo-Saharan":"#c084fc", "Khoisan":"#fdba74",
  "Tungusic":"#fda4af", "Creole":"#94a3b8", "Papuan":"#d8b4fe", "Isolate/Exception":"#e2e8f0"
};

// ─── DATA OVERHAUL (From ALLlanguages.pdf) ────────────────────────────────────
const CONCEPTS = [
  { id:"c1", name:"Language Convergence", def:"When two or more languages combine through contact" },
  { id:"c2", name:"Language Divergence", def:"When a single language splits into dialects and new languages" },
  { id:"c3", name:"Pidgin", def:"Simplified trade language, mix of 2 or more languages for better communication" },
  { id:"c4", name:"Creole", def:"Evolved pidgin that eventually becomes a native language" },
  { id:"c5", name:"Lingua Franca", def:"Bridge language used between groups" },
  { id:"c6", name:"Dialect Continuum", def:"Gradual change of language across regions (e.g., Scandinavian dialect chain)" },
  { id:"c7", name:"Proto-language", def:"Ancestral reconstructed language" },
  { id:"c8", name:"Language Family", def:"Group of related languages from a common ancestor" },
  { id:"c9", name:"Language Isolate", def:"A language with no known relatives" },
  { id:"c10", name:"Toponym", def:"Place name derived from language" },
  { id:"c11", name:"Monolingualism / Multilingualism", def:"Number of languages spoken in a region" },
  { id:"c12", name:"Endangered Language", def:"Language at risk of extinction due to dominance of others" }
];

const LANGS = [
  // ALL AFRICA
  { id:"hausa", name:"Hausa", f:"Afro-Asiatic", sf:"Chadic", spoken:"Nigeria, Niger, Chad, Cameroon, Sudan", cat:"Africa", regionCoords:[11.396, 8.675] },
  { id:"berber", name:"Berber", f:"Afro-Asiatic", sf:"Berber", spoken:"Morocco, Algeria", cat:"Africa" },
  { id:"oromo", name:"Oromo", f:"Afro-Asiatic", sf:"Cushitic", spoken:"Ethiopia, Kenya", cat:"Africa" },
  { id:"somali", name:"Somali", f:"Afro-Asiatic", sf:"Cushitic", spoken:"Somalia, Ethiopia, Kenya", cat:"Africa" },
  { id:"afar", name:"Afar", f:"Afro-Asiatic", sf:"Cushitic", spoken:"Ethiopia, Somalia, Kenya", cat:"Africa" },
  { id:"arabic", name:"Arabic", f:"Afro-Asiatic", sf:"Semitic", spoken:"North & East Africa, Middle East", cat:"Lingua Franca & Creoles", role:"Lingua Franca" },
  { id:"amharic", name:"Amharic", f:"Afro-Asiatic", sf:"Semitic", spoken:"Ethiopia", cat:"Lingua Franca & Creoles", role:"Lingua Franca" },
  { id:"hebrew", name:"Hebrew", f:"Afro-Asiatic", sf:"Semitic", spoken:"Israel", cat:"Asia / European" },
  { id:"tigrinya", name:"Tigrinya", f:"Afro-Asiatic", sf:"Semitic", spoken:"North & East Africa", cat:"Africa" },
  { id:"tigre", name:"Tigre", f:"Afro-Asiatic", sf:"Semitic", spoken:"North & East Africa", cat:"Africa" },
  { id:"maltese", name:"Maltese", f:"Afro-Asiatic", sf:"Semitic", spoken:"Malta", cat:"Africa", note:"Only Afro-Asiatic language spoken in Europe." },
  { id:"yoruba", name:"Yoruba", f:"Niger-Congo", sf:"Niger-Congo A (Non-Bantu)", spoken:"West Africa", cat:"Africa" },
  { id:"igbo", name:"Igbo", f:"Niger-Congo", sf:"Niger-Congo A (Non-Bantu)", spoken:"West Africa", cat:"Africa" },
  { id:"fula", name:"Fula/Fulani", f:"Niger-Congo", sf:"Niger-Congo A (Non-Bantu)", spoken:"West Africa", cat:"Africa" },
  { id:"zulu", name:"Zulu", f:"Niger-Congo", sf:"Niger-Congo B (Bantu)", spoken:"South Africa", cat:"Indigenous", note:"African indigenous language surviving colonial influence." },
  { id:"xhosa", name:"Xhosa", f:"Niger-Congo", sf:"Niger-Congo B (Bantu)", spoken:"South Africa", cat:"Indigenous", note:"African indigenous language surviving colonial influence." },
  { id:"swahili", name:"Swahili", f:"Niger-Congo", sf:"Niger-Congo B (Bantu)", spoken:"East Africa", cat:"Lingua Franca & Creoles", role:"Bantu-based Lingua Franca across East Africa" },
  { id:"songhai", name:"Songhai", f:"Nilo-Saharan", sf:"Songhai", spoken:"Mali, Niger, Benin", cat:"Africa" },
  { id:"saharan", name:"Saharan", f:"Nilo-Saharan", sf:"Saharan", spoken:"Chad, Nigeria, Niger, Sudan, Cameroon, Libya", cat:"Africa" },
  { id:"central-sudanic", name:"Central/Eastern Sudanic", f:"Nilo-Saharan", sf:"Sudanic", spoken:"Central/Eastern Africa", cat:"Africa" },
  { id:"khoisan", name:"Khoisan Languages", f:"Khoisan", sf:"Khoisan", spoken:"Botswana, Namibia, Angola, Zambia, Zimbabwe, Lesotho", cat:"Africa", note:"Feature: Use of click consonants." },
  
  // INDO-EUROPEAN IN AFRICA
  { id:"french", name:"French", f:"Indo-European", sf:"Romance", spoken:"North & Sub-Saharan Africa, Europe", cat:"Lingua Franca & Creoles", role:"International lingua franca (diplomacy)" },
  { id:"portuguese", name:"Portuguese", f:"Indo-European", sf:"Romance", spoken:"Angola, Mozambique, Cape Verde", cat:"Africa" },
  { id:"spanish", name:"Spanish", f:"Indo-European", sf:"Romance", spoken:"Equatorial Guinea, Spain, Americas", cat:"Asia / European" },
  { id:"english", name:"English", f:"Indo-European", sf:"Germanic", spoken:"Global, Nigeria, South Africa", cat:"Lingua Franca & Creoles", role:"Global lingua franca, most spoken lingua franca." },
  { id:"afrikaans", name:"Afrikaans", f:"Indo-European", sf:"Germanic", spoken:"South Africa, Namibia", cat:"Exceptions", note:"Non-full creole." },

  // CREOLES (From Pg 1 & 6)
  { id:"sranan-tongo", name:"Sranan Tongo", f:"Creole", sf:"English-based", spoken:"Suriname", cat:"Lingua Franca & Creoles", note:"Afro-descendant roots." },
  { id:"guyanese-creole", name:"Guyanese", f:"Creole", sf:"English-based", spoken:"Guyana, Suriname, French Guiana", cat:"Lingua Franca & Creoles", note:"Afro-descendant roots." },
  { id:"papiamento", name:"Papiamento", f:"Creole", sf:"Portuguese-based", spoken:"Aruba, Bonaire, Curacao", cat:"Lingua Franca & Creoles", note:"Dutch Caribbean / African influence." },
  { id:"gullah-geechee", name:"Gullah-Geechee", f:"Creole", sf:"English-based", spoken:"Georgia, North/South Carolina, Florida", cat:"Lingua Franca & Creoles" },
  { id:"tok-pisin", name:"Tok Pisin", f:"Creole", sf:"English-based", spoken:"Papua New Guinea", cat:"Lingua Franca & Creoles" },
  { id:"hiri-motu", name:"Hiri Motu", f:"Creole", sf:"Pidgin/Creole", spoken:"Papua New Guinea", cat:"Lingua Franca & Creoles" },
  { id:"chavacano", name:"Chavacano", f:"Creole", sf:"Spanish-based", spoken:"Mindanao, Philippines", cat:"Lingua Franca & Creoles", regionCoords:[6.921, 122.079] },
  { id:"kreyol-ayisyen", name:"Kreyòl Ayisyen", f:"Creole", sf:"French-based", spoken:"Haiti", cat:"Lingua Franca & Creoles" },
  { id:"jopara", name:"Jopara", f:"Creole", sf:"Guarani/Spanish-based", spoken:"Paraguay", cat:"Exceptions" },

  // ASIA / EUROPE
  { id:"gaelic", name:"Gaelic", f:"Indo-European", sf:"Celtic", spoken:"Ireland, Scotland", cat:"Indigenous", note:"Surviving English/French dominance" },
  { id:"welsh", name:"Welsh", f:"Indo-European", sf:"Celtic", spoken:"Wales", cat:"Indigenous", note:"Surviving English/French dominance" },
  { id:"breton", name:"Breton", f:"Indo-European", sf:"Celtic", spoken:"Brittany (France)", cat:"Indigenous", note:"Surviving English/French dominance" },
  { id:"cornish", name:"Cornish", f:"Indo-European", sf:"Celtic", spoken:"Cornwall", cat:"Indigenous", note:"Surviving English/French dominance" },
  { id:"manx", name:"Manx Gaelic", f:"Indo-European", sf:"Celtic", spoken:"Isle of Man", cat:"Indigenous", note:"Surviving English/French dominance" },
  { id:"german", name:"German", f:"Indo-European", sf:"Germanic", spoken:"Germany", cat:"Asia / European" },
  { id:"dutch", name:"Dutch", f:"Indo-European", sf:"Germanic", spoken:"Netherlands", cat:"Asia / European" },
  { id:"swedish", name:"Swedish", f:"Indo-European", sf:"Germanic", spoken:"Sweden", cat:"Asia / European" },
  { id:"yiddish", name:"Yiddish", f:"Indo-European", sf:"Germanic", spoken:"Central/East Europe", cat:"Exceptions", role:"Lingua Franca for Ashkenazi Jews", note:"Non-full creole. Hebrew, Slavic, Germanic-based." },
  { id:"italian", name:"Italian", f:"Indo-European", sf:"Romance", spoken:"Italy", cat:"Asia / European" },
  { id:"romanian", name:"Romanian", f:"Indo-European", sf:"Romance", spoken:"Romania", cat:"Asia / European" },
  { id:"russian", name:"Russian", f:"Indo-European", sf:"Slavic", spoken:"Russia, Post-Soviet states", cat:"Lingua Franca & Creoles", role:"Lingua Franca for Post-Soviet states." },
  { id:"ukrainian", name:"Ukrainian", f:"Indo-European", sf:"Slavic", spoken:"Ukraine", cat:"Asia / European" },
  { id:"polish", name:"Polish", f:"Indo-European", sf:"Slavic", spoken:"Poland", cat:"Asia / European" },
  { id:"lithuanian", name:"Lithuanian", f:"Indo-European", sf:"Baltic", spoken:"Lithuania", cat:"Asia / European" },
  { id:"greek", name:"Greek", f:"Indo-European", sf:"Hellenic", spoken:"Greece", cat:"Asia / European" },
  { id:"albanian", name:"Albanian", f:"Indo-European", sf:"Albanian", spoken:"Albania", cat:"Asia / European" },
  { id:"persian", name:"Persian/Farsi", f:"Indo-European", sf:"Indo-Iranian", spoken:"Iran", cat:"Asia / European" },
  { id:"pashto", name:"Pashto", f:"Indo-European", sf:"Indo-Iranian", spoken:"Afghanistan", cat:"Asia / European" },
  { id:"hindi", name:"Hindi", f:"Indo-European", sf:"Indo-Aryan", spoken:"India", cat:"Lingua Franca & Creoles", role:"Lingua Franca for South/Central Asia" },
  { id:"bengali", name:"Bengali", f:"Indo-European", sf:"Indo-Aryan", spoken:"Bangladesh, India", cat:"Asia / European" },
  
  { id:"mandarin", name:"Mandarin", f:"Sino-Tibetan", sf:"Sinitic", spoken:"East Asia", cat:"Lingua Franca & Creoles", role:"Lingua franca of East Asia" },
  { id:"cantonese", name:"Cantonese", f:"Sino-Tibetan", sf:"Sinitic", spoken:"Southern China, Hong Kong", cat:"Asia / European" },
  { id:"tibetan", name:"Tibetan (Sherpa)", f:"Sino-Tibetan", sf:"Tibetic", spoken:"Tibet", cat:"Asia / European" },
  { id:"burmese", name:"Burmese", f:"Sino-Tibetan", sf:"Burmese", spoken:"Myanmar", cat:"Asia / European" },
  { id:"karenic", name:"Karenic", f:"Sino-Tibetan", sf:"Karenic", spoken:"Myanmar-Thailand border", cat:"Asia / European", regionCoords:[17.5, 97.5] },
  { id:"dzongkha", name:"Dzongkha", f:"Sino-Tibetan", sf:"Dzongkha", spoken:"Bhutan", cat:"Asia / European" },

  { id:"vietnamese", name:"Vietnamese", f:"Austro-Asiatic", sf:"Vietic", spoken:"Vietnam", cat:"Asia / European" },
  { id:"khmer", name:"Khmer", f:"Austro-Asiatic", sf:"Khmeric", spoken:"Cambodia", cat:"Asia / European" },
  { id:"mon", name:"Mon", f:"Austro-Asiatic", sf:"Monic", spoken:"Myanmar, Thailand", cat:"Asia / European" },

  { id:"malay", name:"Malay / Indonesian", f:"Austronesian", sf:"Malayo-Polynesian", spoken:"Malaysia, Indonesia, Brunei, Singapore", cat:"Lingua Franca & Creoles", role:"Lingua franca spoken in SE Asia" },
  { id:"javanese", name:"Javanese", f:"Austronesian", sf:"Malayo-Polynesian", spoken:"Indonesia", cat:"Asia / European" },
  { id:"tagalog", name:"Tagalog", f:"Austronesian", sf:"Philippine", spoken:"Philippines", cat:"Asia / European" },
  { id:"ilocano", name:"Ilocano", f:"Austronesian", sf:"Philippine", spoken:"Philippines", cat:"Asia / European" },
  { id:"malagasy", name:"Malagasy", f:"Austronesian", sf:"Malayo-Polynesian", spoken:"Madagascar", cat:"Asia / European" },
  { id:"hawaiian", name:"Hawaiian", f:"Austronesian", sf:"Polynesian", spoken:"Hawaii", cat:"Indigenous", note:"Revived after U.S. colonization." },
  { id:"maori", name:"Maori", f:"Austronesian", sf:"Polynesian", spoken:"New Zealand", cat:"Indigenous", note:"Revitalized in New Zealand." },
  { id:"melanesian", name:"Melanesian", f:"Austronesian", sf:"Melanesian", spoken:"Papua New Guinea, Fiji, Solomon Islands", cat:"Asia / European" },

  { id:"tamil", name:"Tamil", f:"Dravidian", sf:"Southern Dravidian", spoken:"Southern India, Sri Lanka", cat:"Asia / European", regionCoords:[11.127, 78.656] },
  { id:"telugu", name:"Telugu", f:"Dravidian", sf:"South-Central Dravidian", spoken:"Southern India", cat:"Asia / European" },

  { id:"finnish", name:"Finnish", f:"Uralic", sf:"Finnic", spoken:"Finland", cat:"Asia / European" },
  { id:"hungarian", name:"Hungarian", f:"Uralic", sf:"Ugric", spoken:"Hungary", cat:"Asia / European" },
  { id:"sami", name:"Sami", f:"Uralic", sf:"Sami", spoken:"Northern Europe (Norway, Sweden, Finland)", cat:"Indigenous" },

  { id:"turkish", name:"Turkish", f:"Turkic", sf:"Oghuz", spoken:"Central & Northern Asia", cat:"Asia / European" },
  { id:"uzbek", name:"Uzbek", f:"Turkic", sf:"Karluk", spoken:"Central & Northern Asia", cat:"Asia / European" },

  { id:"manchu", name:"Manchu", f:"Tungusic", sf:"Manchu", spoken:"Siberia (Russia), NE China", cat:"Asia / European" },

  { id:"thai", name:"Thai", f:"Tai-Kadai", sf:"Tai", spoken:"Thailand", cat:"Asia / European" },
  { id:"lao", name:"Lao", f:"Tai-Kadai", sf:"Tai", spoken:"Laos", cat:"Asia / European" },

  { id:"korean", name:"Korean", f:"Koreanic", sf:"Korean", spoken:"North & South Korea", cat:"Exceptions", note:"Debated isolate." },
  { id:"jeju", name:"Jeju", f:"Koreanic", sf:"Jeju", spoken:"Island off coast of Korea", cat:"Asia / European", regionCoords:[33.489, 126.498] },

  { id:"japanese", name:"Japanese", f:"Japonic", sf:"Japanese", spoken:"Japan", cat:"Exceptions", note:"Partially isolated." },
  { id:"ainu", name:"Ainu", f:"Japonic", sf:"Ainu", spoken:"Japan", cat:"Exceptions", note:"Indigenous isolate, near extinct." },

  { id:"georgian", name:"Georgian", f:"Caucasian", sf:"South Caucasian", spoken:"Caucasus area", cat:"Asia / European" },

  // OTHER INDIGENOUS / EXCEPTIONS
  { id:"basque", name:"Basque (Euskara)", f:"Isolate/Exception", sf:"Isolate", spoken:"Spain/France border", cat:"Exceptions", note:"Survived Indo-European expansion. Language isolate in Europe." },
  { id:"pama-nyungan", name:"Aboriginal Pama-Nyungan", f:"Pama-Nyungan", sf:"Aboriginal", spoken:"Australia", cat:"Indigenous" },
  { id:"papuan", name:"Papuan Languages", f:"Papuan", sf:"Papuan", spoken:"New Guinea", cat:"Indigenous", note:"Non-Austronesian." },
  { id:"quechua", name:"Quechua", f:"Quechuan", sf:"Indigenous", spoken:"South America", cat:"Indigenous" },
  { id:"guarani", name:"Guarani", f:"Tupian", sf:"Indigenous", spoken:"South America", cat:"Indigenous" },
  { id:"sumerian", name:"Sumerian", f:"Isolate/Exception", sf:"Isolate", spoken:"Ancient Mesopotamia", cat:"Exceptions", note:"Ancient isolate." },
  { id:"burushaski", name:"Burushaski", f:"Isolate/Exception", sf:"Isolate", spoken:"Pakistan", cat:"Exceptions" },
  { id:"esperanto", name:"Esperanto", f:"Constructed", sf:"Constructed", spoken:"Global", cat:"Exceptions", role:"Lingua franca with no native speakers." },
  { id:"xinca", name:"Xinca", f:"Isolate/Exception", sf:"Isolate", spoken:"Bhutan", cat:"Lingua Franca & Creoles" }, // Note: Pdf says Bhutan, likely a typo in original doc but mapping as requested
];

// ISO mapping subset
const ISO_MAP = {
  "hausa":["NGA","NER","TCD","CMR","SDN"], "hebrew":["ISR"], "maltese":["MLT"],
  "french":["FRA","CAF","COG","COD","MDG","MLI","SEN","TCD"], "portuguese":["PRT","AGO","MOZ","CPV"],
  "spanish":["ESP","GNQ","MEX","ARG","COL","CHL","PER"], "english":["GBR","USA","CAN","AUS","NZL","NGA","ZAF"],
  "sranan-tongo":["SUR"], "guyanese-creole":["GUY"], "papiamento":["ABW","CUW"],
  "tok-pisin":["PNG"], "kreyol-ayisyen":["HTI"], "jopara":["PRY"],
  "german":["DEU"], "dutch":["NLD"], "swedish":["SWE"], "italian":["ITA"], "romanian":["ROU"],
  "russian":["RUS"], "ukrainian":["UKR"], "polish":["POL"], "lithuanian":["LTU"],
  "greek":["GRC"], "albanian":["ALB"], "persian":["IRN"], "pashto":["AFG"], "hindi":["IND"],
  "bengali":["BGD"], "mandarin":["CHN","TWN"], "burmese":["MMR"], "dzongkha":["BTN"],
  "vietnamese":["VNM"], "khmer":["KHM"], "malay":["MYS","IDN","BRN"], "javanese":["IDN"],
  "tagalog":["PHL"], "malagasy":["MDG"], "maori":["NZL"], "finnish":["FIN"], "hungarian":["HUN"],
  "turkish":["TUR"], "uzbek":["UZB"], "thai":["THA"], "lao":["LAO"], "korean":["KOR","PRK"],
  "japanese":["JPN"], "georgian":["GEO"], "pama-nyungan":["AUS"], "papuan":["PNG"],
  "quechua":["PER","BOL","ECU"], "guarani":["PRY"], "esperanto":[]
};

// Helpers
function getRandItems(arr, n) {
  const s = [...arr]; for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}
  return s.slice(0,n);
}

// ─── MAIN APP ROUTER ──────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("subject"); // subject, unit, app
  const [themeId, setThemeId] = useState("midnight");
  const T = THEMES[themeId];

  if (view === "subject") return <SubjectSelection setView={setView} T={T} />;
  if (view === "unit") return <UnitSelection setView={setView} T={T} />;
  return <UnitApp setView={setView} themeId={themeId} setThemeId={setThemeId} T={T} />;
}

// ─── NAV SCREENS ─────────────────────────────────────────────────────────────
function SubjectSelection({ setView, T }) {
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.fb,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:14,letterSpacing:4,color:T.primary,fontWeight:600,textTransform:"uppercase",marginBottom:24}}>Select Subject</div>
      <div style={{display:"flex",gap:24,flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={()=>setView("unit")} className="mode-card" style={{background:T.card,border:`2px solid ${T.primary}`,borderRadius:16,padding:"40px 32px",cursor:"pointer",color:T.text,width:280}}>
          <div style={{fontSize:40,marginBottom:16}}>🌍</div>
          <div style={{fontFamily:T.ff,fontSize:24,fontWeight:700}}>AP Human Geography</div>
        </button>
        <button disabled style={{background:T.card2,border:`2px solid ${T.border}`,borderRadius:16,padding:"40px 32px",color:T.muted,width:280,opacity:0.6,cursor:"not-allowed"}}>
          <div style={{fontSize:40,marginBottom:16}}>📜</div>
          <div style={{fontFamily:T.ff,fontSize:24,fontWeight:700}}>AP World History</div>
          <div style={{fontSize:13,marginTop:8}}>Coming Soon</div>
        </button>
      </div>
    </div>
  );
}

function UnitSelection({ setView, T }) {
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.fb,display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 24px"}}>
      <button onClick={()=>setView("subject")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",marginBottom:40,fontSize:14}}>← Back to Subjects</button>
      <div style={{fontSize:14,letterSpacing:4,color:T.primary,fontWeight:600,textTransform:"uppercase",marginBottom:24}}>AP Human Geography</div>
      <div style={{display:"flex",flexDirection:"column",gap:16,width:"100%",maxWidth:600}}>
        <button onClick={()=>setView("app")} className="mode-card" style={{background:T.card,border:`1px solid ${T.primary}`,borderLeft:`6px solid ${T.primary}`,borderRadius:12,padding:"24px 32px",cursor:"pointer",color:T.text,textAlign:"left"}}>
          <div style={{fontSize:13,color:T.primaryLight,marginBottom:4}}>Unit 3</div>
          <div style={{fontFamily:T.ff,fontSize:22,fontWeight:700}}>Cultural Patterns & Processes (Language)</div>
        </button>
        <button disabled style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:"24px 32px",color:T.muted,textAlign:"left",opacity:0.6,cursor:"not-allowed"}}>
          <div style={{fontSize:13,marginBottom:4}}>Unit 4</div>
          <div style={{fontFamily:T.ff,fontSize:22,fontWeight:700}}>Political Patterns & Processes</div>
          <div style={{fontSize:12,marginTop:4}}>Coming Soon</div>
        </button>
      </div>
    </div>
  );
}

// ─── MAIN UNIT APP ────────────────────────────────────────────────────────────
function UnitApp({ setView, themeId, setThemeId, T }) {
  const [mode, setMode] = useState("menu");

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.fb,overflowX:"hidden"}}>
      {mode==="menu"   && <MainMenu onSelect={setMode} setGlobalView={setView} themeId={themeId} setThemeId={setThemeId} T={T}/>}
      {mode==="quiz"   && <QuizSetup back={()=>setMode("menu")} T={T}/>}
      {mode==="map"    && <MapMode back={()=>setMode("menu")} T={T}/>}
    </div>
  );
}

// ─── MAIN MENU ────────────────────────────────────────────────────────────────
function MainMenu({onSelect, setGlobalView, themeId, setThemeId, T}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px"}}>
      <div style={{width:"100%",maxWidth:900,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
        <button onClick={()=>setGlobalView("unit")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>← Change Unit</button>
        
        {/* Theme Selector */}
        <div style={{display:"flex",gap:8,background:T.card2,padding:6,borderRadius:20,border:`1px solid ${T.border}`}}>
          {Object.entries(THEMES).map(([id, t])=>(
            <button key={id} onClick={()=>setThemeId(id)} style={{
              background:themeId===id?t.primary:"transparent", border:"none",
              color:themeId===id?t.bg:T.muted, borderRadius:14, padding:"4px 12px",
              fontSize:12, fontWeight:600, cursor:"pointer"
            }}>{t.name}</button>
          ))}
        </div>
      </div>

      <div style={{textAlign:"center",marginBottom:56}}>
        <div style={{fontSize:13,letterSpacing:6,color:T.primary,fontFamily:T.fb,fontWeight:600,textTransform:"uppercase",marginBottom:16}}>AP HUG · Unit 3</div>
        <h1 style={{fontFamily:T.ff,fontSize:"clamp(40px,8vw,80px)",fontWeight:900,lineHeight:1.05,color:T.text,marginBottom:16}}>
          Language<br/><span style={{color:T.primary,fontStyle:"italic"}}>Atlas</span>
        </h1>
        <p style={{color:T.muted,fontSize:16,maxWidth:440,margin:"0 auto",lineHeight:1.6}}>
          {LANGS.length} languages & concepts based strictly on the Master PDF.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,width:"100%",maxWidth:600}}>
        <button className="mode-card" onClick={()=>onSelect("quiz")} style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"28px 24px", textAlign:"left", cursor:"pointer", color:T.text}}>
          <div style={{fontSize:32,marginBottom:12}}>🧠</div>
          <div style={{fontFamily:T.ff,fontSize:22,fontWeight:700,marginBottom:6,color:T.primaryLight}}>Quiz Mode</div>
          <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>6 PDF Iterations + Concepts. 20 Q's or Infinite.</div>
        </button>
        <button className="mode-card" onClick={()=>onSelect("map")} style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"28px 24px", textAlign:"left", cursor:"pointer", color:T.text}}>
          <div style={{fontSize:32,marginBottom:12}}>🗺️</div>
          <div style={{fontFamily:T.ff,fontSize:22,fontWeight:700,marginBottom:6,color:T.primaryLight}}>Interactive Map</div>
          <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>Zoomable world map with regional language plots.</div>
        </button>
      </div>
    </div>
  );
}

// ─── STATIC QUIZ LOGIC (No AI) ───────────────────────────────────────────────
function generateStaticQuestions(category) {
  let pool = [];
  
  // Specific PDF Trivia Facts
  const trivia = [
    { q: "Which is the only Afro-Asiatic language spoken in Europe?", a: "Maltese", opts: ["Maltese", "Arabic", "Berber", "Hausa"] },
    { q: "Why did people in Europe give themselves power in the beginning?", a: "Because they domesticated the horse.", opts: ["Because they domesticated the horse.", "Because they invented the wheel.", "Because of early gunpowder access.", "Because they originated agriculture."] },
    { q: "Who was the leader of the Mongolia Empire?", a: "Genghis Khan", opts: ["Genghis Khan", "Attila the Hun", "Kublai Khan", "Sun Tzu"] },
    { q: "What is the most spoken lingua franca in the world?", a: "English", opts: ["English", "Mandarin", "Spanish", "French"] },
    { q: "What are the 2 most spoken languages in India?", a: "Hindi and English", opts: ["Hindi and English", "Hindi and Bengali", "Telugu and Tamil", "English and Urdu"] },
    { q: "Which of these is a lingua franca with NO native language speakers?", a: "Esperanto", opts: ["Esperanto", "Swahili", "Tok Pisin", "Sranan Tongo"] },
    { q: "Every Caribbean country has a...", a: "Creole", opts: ["Creole", "Pidgin", "Language Isolate", "Dialect Continuum"] }
  ];

  if (category === "All" || category === "Exceptions") pool.push(...trivia);

  // Concept Questions
  if (category === "All" || category === "Concepts") {
    CONCEPTS.forEach(c => {
      let wrongOpts = getRandItems(CONCEPTS.filter(x => x.id !== c.id), 3).map(x => x.name);
      pool.push({ q: `Which concept is defined as: "${c.def}"?`, a: c.name, opts: getRandItems([c.name, ...wrongOpts], 4) });
    });
  }

  // Language Specific Questions
  let langSubset = category === "All" ? LANGS : LANGS.filter(l => l.cat === category);
  
  langSubset.forEach(l => {
    // Family Question
    let wrongFams = getRandItems(Object.keys(FC).filter(f => f !== l.f), 3);
    pool.push({ q: `What language family does "${l.name}" belong to?`, a: l.f, opts: getRandItems([l.f, ...wrongFams], 4) });
    
    // Spoken Region
    if(l.spoken) {
      let wrongLocs = getRandItems(LANGS.filter(x => x.spoken !== l.spoken), 3).map(x => x.spoken);
      pool.push({ q: `Where is "${l.name}" primarily spoken?`, a: l.spoken, opts: getRandItems([l.spoken, ...wrongLocs], 4) });
    }
  });

  return getRandItems(pool, pool.length); // Shuffle
}

// ─── QUIZ SETUP & RUNNER ──────────────────────────────────────────────────────
function QuizSetup({ back, T }) {
  const [activeQuiz, setActiveQuiz] = useState(null); // { cat, length, qs }

  const start = (cat, length) => {
    const qs = generateStaticQuestions(cat);
    setActiveQuiz({ cat, length, qs, current:0, correct:0 });
  };

  if (activeQuiz) return <QuizRunner activeQuiz={activeQuiz} setActiveQuiz={setActiveQuiz} back={back} T={T} />;

  const categories = ["All", "Africa", "Asia / European", "Indigenous", "Lingua Franca & Creoles", "Exceptions", "Concepts"];

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px"}}>
      <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",marginBottom:32,fontSize:14}}>← Back</button>
      <div style={{fontFamily:T.ff,fontSize:32,color:T.primaryLight,marginBottom:24}}>Quiz Setup</div>
      
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16,width:"100%",maxWidth:800}}>
        {categories.map(cat => (
          <div key={cat} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontFamily:T.fb,fontWeight:600,fontSize:16,color:T.text,marginBottom:12}}>{cat}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>start(cat, 20)} style={{flex:1,background:`${T.primary}22`,color:T.primaryLight,border:`1px solid ${T.primary}55`,borderRadius:8,padding:"8px",cursor:"pointer"}}>20 Q's</button>
              <button onClick={()=>start(cat, "infinite")} style={{flex:1,background:T.card2,color:T.muted,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px",cursor:"pointer"}}>∞ Infinite</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizRunner({ activeQuiz, setActiveQuiz, back, T }) {
  const [chosen, setChosen] = useState(null);
  
  const q = activeQuiz.qs[activeQuiz.current];
  const isDone = activeQuiz.length !== "infinite" && activeQuiz.current >= activeQuiz.length;
  const isCorrect = chosen === q?.a;

  const next = () => {
    setChosen(null);
    setActiveQuiz(prev => ({ ...prev, current: prev.current + 1 }));
  };

  if (isDone || !q) {
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{fontFamily:T.ff,fontSize:36,color:T.primaryLight,marginBottom:16}}>Quiz Complete!</div>
        <div style={{fontSize:20,color:T.text,marginBottom:32}}>Score: {activeQuiz.correct}</div>
        <button onClick={()=>setActiveQuiz(null)} style={{background:T.primary,color:T.bg,padding:"12px 24px",borderRadius:12,fontWeight:700,border:"none",cursor:"pointer"}}>Play Again</button>
      </div>
    );
  }

  const handlePick = (opt) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.a) setActiveQuiz(prev => ({...prev, correct: prev.correct + 1}));
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px"}}>
      <div style={{width:"100%",maxWidth:600}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:24,color:T.muted,fontSize:14}}>
          <button onClick={()=>setActiveQuiz(null)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer"}}>Quit</button>
          <div>{activeQuiz.cat} · Q: {activeQuiz.current + 1} {activeQuiz.length !== "infinite" && `/ ${activeQuiz.length}`}</div>
          <div style={{color:"#34d399"}}>Score: {activeQuiz.correct}</div>
        </div>

        <div className="fade-in" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"32px",marginBottom:24}}>
          <div style={{fontFamily:T.ff,fontSize:22,lineHeight:1.4}}>{q.q}</div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {q.opts.map((opt, i) => {
            let bg = T.card, border = T.border, color = T.text;
            if (chosen) {
              if (opt === q.a) { bg = "#10b98120"; border = "#10b981"; color = "#34d399"; }
              else if (opt === chosen) { bg = "#ef444420"; border = "#ef4444"; color = "#f87171"; }
            }
            return (
              <button key={i} onClick={()=>handlePick(opt)} className="quiz-opt" style={{
                background:bg, border:`1px solid ${border}`, color, borderRadius:12, padding:"16px", textAlign:"left", cursor:chosen?"default":"pointer", fontSize:15
              }}>{opt}</button>
            )
          })}
        </div>

        {chosen && (
          <button onClick={next} className="fade-in" style={{width:"100%",marginTop:24,padding:"16px",background:T.primary,color:T.bg,border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>
            Next Question →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAP MODE WITH ZOOM & REGIONAL MARKERS ────────────────────────────────────
function MapMode({ back, T }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [w, setW] = useState(900);
  const h = Math.max(500, w*0.55);

  useEffect(()=>{
    if(!containerRef.current) return;
    const ro = new ResizeObserver(es => { if(es[0].contentRect.width > 0) setW(es[0].contentRect.width); });
    ro.observe(containerRef.current);
    return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(topo => {
        if(!window.topojson) {
           const s = document.createElement("script");
           s.src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
           document.head.appendChild(s);
           s.onload = () => setGeoData(window.topojson.feature(topo, topo.objects.countries));
        } else {
           setGeoData(window.topojson.feature(topo, topo.objects.countries));
        }
      });
  },[]);

  useEffect(()=>{
    if(!geoData || !svgRef.current || w === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    
    // Zoom wrapping group
    const g = svg.append("g");
    
    // Setup Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Map Projection
    const proj = d3.geoNaturalEarth1().scale(w/5.5).translate([w/2, h/2]);
    const pathFn = d3.geoPath().projection(proj);

    // Background Map
    g.selectAll("path.country")
      .data(geoData.features).enter().append("path")
      .attr("d", pathFn)
      .attr("fill", "#151e2e")
      .attr("stroke", "#09111f").attr("stroke-width", 0.5);

    // Plot Regional Language Dots
    const markers = LANGS.filter(l => l.regionCoords);
    
    g.selectAll("circle.marker")
      .data(markers).enter().append("circle")
      .attr("cx", d => proj([d.regionCoords[1], d.regionCoords[0]])[0])
      .attr("cy", d => proj([d.regionCoords[1], d.regionCoords[0]])[1])
      .attr("r", 4)
      .attr("fill", d => FC[d.f] || T.primary)
      .attr("stroke", T.bg)
      .attr("stroke-width", 1);
      
    g.selectAll("text.label")
      .data(markers).enter().append("text")
      .attr("x", d => proj([d.regionCoords[1], d.regionCoords[0]])[0] + 6)
      .attr("y", d => proj([d.regionCoords[1], d.regionCoords[0]])[1] + 3)
      .text(d => d.name)
      .attr("font-size", "8px")
      .attr("fill", "#fff")
      .attr("font-family", T.fb);

  },[geoData, w, h, T]);

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>← Back</button>
        <div style={{fontFamily:T.ff,fontSize:24,color:T.primaryLight}}>Regional Dialect Explorer</div>
        <div style={{fontSize:12,color:T.muted}}>Scroll to Zoom • Drag to Pan</div>
      </div>
      <div ref={containerRef} style={{flex:1,background:"#09111f",borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden"}}>
        {!geoData ? <div style={{padding:40,color:T.muted}}>Loading Map...</div> : <svg ref={svgRef} style={{width:"100%",height:"100%"}}/>}
      </div>
    </div>
  );
}
export default App;
