import { useState, useRef } from "react";

const AGENTS = [
  {
    id: "brutal",
    name: "CRITIQUE BRUTAL",
    role: "L'œil qui déteste le générique",
    color: "#ff3333",
    icon: "✕",
    getPrompt: (type) => `Tu es un critique d'art digital extrêmement exigeant et brutal. Tu hais le générique. Tu as vu des milliers d'œuvres cyberpunk sur Midjourney, Redbubble, ArtStation et Etsy. Tu sais immédiatement distinguer une œuvre qui a une âme de celles qui sont des variations Midjourney sans personnalité.

Cette image est destinée à être vendue comme ${type === 'toile' ? 'TOILE CANVAS (70-100€)' : 'T-SHIRT PREMIUM (30-45€)'} sur RBL//CØRE, un shop cyberpunk belge ciblant les fans de techno et amateurs d'art en Europe.

Sois BRUTAL et HONNÊTE. Dis exactement ce qui ne va pas. Pas de diplomatie. Si c'est générique, dis-le clairement avec des exemples précis de ce qu'on voit partout ailleurs. Si quelque chose est fort, dis-le aussi mais sans exagérer.

Conclus avec: SCORE ORIGINALITÉ: X/10 et une phrase courte verdict. Réponds en français, 4-5 phrases max.`
  },
  {
    id: "market",
    name: "VENDEUR PRAGMATIQUE",
    role: "Seul le chiffre d'affaires compte",
    color: "#ffcc00",
    icon: "€",
    getPrompt: (type) => `Tu es un vendeur e-commerce pragmatique et froid. Tu ne t'intéresses pas à l'art — tu t'intéresses aux conversions. Tu analyses des images uniquement sous l'angle : est-ce que ça va se vendre ou pas ?

Cette image sera vendue comme ${type === 'toile' ? 'TOILE CANVAS (70-100€)' : 'T-SHIRT PREMIUM (30-45€)'} sur RBL//CØRE, ciblant fans de techno (Belgique, France, Allemagne, Pays-Bas, 22-35 ans).

Analyse UNIQUEMENT sous angle commercial:
- Premier coup d'œil en scroll Instagram/TikTok: ça stoppe ou pas?
- La cible techno européenne va sortir sa carte bleue ou passer?
- Le prix ${type === 'toile' ? '70-100€' : '30-45€'} est justifiable avec cette image?
- Risque de retours/insatisfaction clients?

Conclus avec: POTENTIEL VENTE: X/10 et prix recommandé précis. Réponds en français, 4-5 phrases max. Sois froid et direct.`
  },
  {
    id: "artist",
    name: "ARTISTE VISIONNAIRE",
    role: "La direction artistique avant tout",
    color: "#00e5ff",
    icon: "◈",
    getPrompt: (type) => `Tu es un directeur artistique avec 15 ans d'expérience dans le design cyberpunk, la direction de marques underground européennes et la curation d'art digital. Tu as une vision précise de ce qui définit une identité de marque forte vs un simple beau rendu.

Cette image sera vendue comme ${type === 'toile' ? 'TOILE CANVAS (70-100€)' : 'T-SHIRT PREMIUM (30-45€)'} dans le shop RBL//CØRE (palette cyan #00e5ff / magenta #cc00ff / fond #050810, esthétique cyberpunk/techno).

Analyse sous angle direction artistique:
- Cette image renforce-t-elle une identité de marque ou dilue-t-elle RBL//CØRE?
- La composition, les tensions visuelles, le storytelling narratif
- Ce qui est fort et doit être conservé
- UNE modification précise qui changerait tout

Conclus avec: SCORE DIRECTION ARTISTIQUE: X/10 et l'action concrète prioritaire. Réponds en français, 4-5 phrases max.`
  },
  {
    id: "customer",
    name: "CLIENT CIBLE",
    role: "Fan de techno, 28 ans, Berlin",
    color: "#00ff88",
    icon: "◎",
    getPrompt: (type) => `Tu joues le rôle précis de ce client: tu as 28 ans, tu vas chaque mois en club techno (Berghain, Fuse, Concrete), tu habites un appartement minimaliste sombre à Bruxelles, tu as un budget limité mais tu achètes des choses de qualité quand elles te touchent vraiment. Tu as déjà acheté du merch de qualité pour des artistes ou des labels que tu adores.

On te montre cette image qui sera vendue comme ${type === 'toile' ? `TOILE CANVAS à accrocher chez toi (prix: 70-100€)` : `T-SHIRT PREMIUM à porter en club ou dans la rue (prix: 30-45€)`}.

Réagis comme un vrai être humain, pas comme un expert:
- Ta réaction instinctive en 2 secondes?
- Est-ce que tu l'achèterais? Pourquoi exactement?
- Qu'est-ce qui te ferait hésiter?
- Qu'est-ce qui te ferait sortir ta carte immédiatement sans réfléchir?

Conclus avec: J'ACHÈTE / J'HÉSITE / JE PASSE — et une raison en une phrase. Réponds en français, style naturel et direct, 4-5 phrases.`
  }
];

const getConsensusPrompt = (type, reviews) => `Tu es le jury final pour RBL//CØRE, un shop cyberpunk belge. 4 experts viennent d'analyser une image destinée à être vendue comme ${type === 'toile' ? 'TOILE CANVAS (70-100€)' : 'T-SHIRT PREMIUM (30-45€)'}.

Voici leurs avis:

${reviews}

Synthétise en VERDICT FINAL ACTIONNABLE:
1. DÉCISION: Vendable tel quel / À modifier / À abandonner
2. PRIX RECOMMANDÉ: montant précis en €
3. SI MODIFICATION: UNE seule action prioritaire, très précise
4. SCORE FINAL: X/10

Maximum 4 phrases. Sois direct et actionnable. Réponds en français.`;

export default function RBLConsensusV2() {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [productType, setProductType] = useState(null);
  const [reviews, setReviews] = useState({});
  const [consensus, setConsensus] = useState(null);
  const [loading, setLoading] = useState({});
  const [loadingConsensus, setLoadingConsensus] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setReviews({});
    setConsensus(null);
    setProductType(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = (e) => setImageData({ base64: e.target.result.split(",")[1], mediaType: file.type });
    reader.readAsDataURL(file);
  };

  const analyzeAgent = async (agent) => {
    if (!imageData || !productType) return;
    setLoading(l => ({ ...l, [agent.id]: true }));
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: agent.getPrompt(productType),
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imageData.mediaType, data: imageData.base64 } },
              { type: "text", text: `Analyse cette image pour RBL//CØRE. Type de produit: ${productType === 'toile' ? 'TOILE CANVAS' : 'T-SHIRT PREMIUM'}.` }
            ]
          }]
        })
      });
      const data = await res.json();
      setReviews(r => ({ ...r, [agent.id]: data.content?.[0]?.text || "Erreur." }));
    } catch {
      setReviews(r => ({ ...r, [agent.id]: "Erreur lors de l'analyse." }));
    }
    setLoading(l => ({ ...l, [agent.id]: false }));
  };

  const analyzeAll = async () => {
    if (!imageData || !productType) return;
    setReviews({});
    setConsensus(null);
    setSaved(false);
    await Promise.all(AGENTS.map(a => analyzeAgent(a)));
  };

  const buildConsensus = async () => {
    const allReviews = AGENTS.map(a => `[${a.name}]: ${reviews[a.id] || "Pas d'avis"}`).join("\n\n");
    setLoadingConsensus(true);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{ role: "user", content: getConsensusPrompt(productType, allReviews) }]
        })
      });
      const data = await res.json();
      setConsensus(data.content?.[0]?.text || "Erreur.");
    } catch {
      setConsensus("Erreur lors du consensus.");
    }
    setLoadingConsensus(false);
  };

  const saveVerdict = () => {
    const text = `RBL//CØRE — ANALYSE PRODUIT\n${'='.repeat(40)}\nType: ${productType?.toUpperCase()}\nDate: ${new Date().toLocaleDateString('fr-BE')}\n\n${AGENTS.map(a => `[${a.name}]\n${reviews[a.id] || ''}`).join('\n\n')}\n\n${'='.repeat(40)}\nVERDICT CONSENSUS\n${consensus}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rblcore_verdict_${Date.now()}.txt`;
    a.click();
    setSaved(true);
  };

  const allDone = AGENTS.every(a => reviews[a.id]);
  const anyLoading = AGENTS.some(a => loading[a.id]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050810",
      fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      color: "#fff",
      padding: "20px 16px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Scan line effect */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.02) 2px, rgba(0,229,255,0.02) 4px)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: 10, color: "#00e5ff44", marginBottom: 4 }}>
            ◈ ◈ ◈
          </div>
          <h1 style={{
            fontSize: 20, fontWeight: 900, letterSpacing: 4, margin: "0 0 4px",
            background: "linear-gradient(90deg, #00e5ff, #cc00ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            RBL//CØRE PANEL
          </h1>
          <div style={{ fontSize: 9, color: "#333", letterSpacing: 3 }}>
            4 AGENTS · VERDICT · PRIX · ACTION
          </div>
        </div>

        {/* Upload */}
        <div
          onClick={() => !image && fileRef.current.click()}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `1px solid ${dragOver ? "#cc00ff" : image ? "#1a2a3a" : "#0a1a2a"}`,
            borderRadius: 6, marginBottom: 16, overflow: "hidden",
            cursor: image ? "default" : "pointer",
            transition: "border-color 0.2s",
            background: image ? "transparent" : "#060c14"
          }}
        >
          {image ? (
            <div style={{ position: "relative" }}>
              <img src={image} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block" }} />
              <button onClick={() => fileRef.current.click()} style={{
                position: "absolute", top: 8, right: 8,
                background: "#050810cc", border: "1px solid #333", borderRadius: 4,
                color: "#666", fontSize: 9, padding: "4px 8px", cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 1
              }}>CHANGER</button>
            </div>
          ) : (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, color: "#0a2030", marginBottom: 10 }}>⊕</div>
              <div style={{ color: "#00e5ff66", fontSize: 11, letterSpacing: 2 }}>UPLOADER L'IMAGE</div>
              <div style={{ color: "#222", fontSize: 9, marginTop: 4 }}>toile · t-shirt · mockup</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Product type selector */}
        {image && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8 }}>
              TYPE DE PRODUIT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "toile", label: "TOILE CANVAS", price: "70–100€", icon: "◫" },
                { id: "tshirt", label: "T-SHIRT", price: "30–45€", icon: "◻" }
              ].map(p => (
                <button key={p.id} onClick={() => setProductType(p.id)} style={{
                  padding: "12px 8px",
                  background: productType === p.id ? (p.id === 'toile' ? "#00e5ff18" : "#cc00ff18") : "#060c14",
                  border: `1px solid ${productType === p.id ? (p.id === 'toile' ? "#00e5ff" : "#cc00ff") : "#1a2a3a"}`,
                  borderRadius: 6, color: productType === p.id ? (p.id === 'toile' ? "#00e5ff" : "#cc00ff") : "#444",
                  fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                  letterSpacing: 2, transition: "all 0.2s"
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon}</div>
                  <div style={{ fontWeight: "bold" }}>{p.label}</div>
                  <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{p.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Launch button */}
        {image && productType && (
          <button onClick={analyzeAll} disabled={anyLoading} style={{
            width: "100%", padding: "13px",
            background: anyLoading ? "#060c14" : "linear-gradient(90deg, #00e5ff15, #cc00ff15)",
            border: `1px solid ${anyLoading ? "#111" : "#00e5ff55"}`,
            borderRadius: 6, color: anyLoading ? "#333" : "#00e5ff",
            fontSize: 11, letterSpacing: 3, cursor: anyLoading ? "not-allowed" : "pointer",
            marginBottom: 20, fontFamily: "inherit", transition: "all 0.2s"
          }}>
            {anyLoading ? "◌ ANALYSE EN COURS..." : "▶ LANCER L'ANALYSE"}
          </button>
        )}

        {/* Agent cards */}
        {AGENTS.map((agent, i) => (
          <div key={agent.id} style={{
            border: `1px solid ${reviews[agent.id] ? agent.color + "33" : "#0d1520"}`,
            borderRadius: 6, marginBottom: 12, overflow: "hidden",
            transition: "border-color 0.4s",
            animationDelay: `${i * 0.1}s`
          }}>
            <div style={{
              background: reviews[agent.id] ? agent.color + "0d" : "#060c14",
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
              borderBottom: reviews[agent.id] ? `1px solid ${agent.color}22` : "1px solid #0d1520"
            }}>
              <span style={{ fontSize: 16, color: agent.color, width: 20, textAlign: "center" }}>
                {loading[agent.id] ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> : agent.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: agent.color, fontWeight: "bold" }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: 8, color: "#333", letterSpacing: 1, marginTop: 1 }}>{agent.role}</div>
              </div>
              {reviews[agent.id] && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent.color }} />
              )}
            </div>

            {loading[agent.id] && (
              <div style={{ padding: "12px 14px", fontSize: 9, color: agent.color + "88", letterSpacing: 2 }}>
                ANALYSE EN COURS...
              </div>
            )}

            {reviews[agent.id] && (
              <div style={{
                padding: "12px 14px", fontSize: 11, lineHeight: 1.8,
                color: "#bbb", background: "#040810"
              }}>
                {reviews[agent.id]}
              </div>
            )}

            {!reviews[agent.id] && !loading[agent.id] && (
              <div style={{ padding: "10px 14px", fontSize: 9, color: "#1a2530", letterSpacing: 1 }}>
                EN ATTENTE...
              </div>
            )}
          </div>
        ))}

        {/* Consensus button */}
        {allDone && !consensus && (
          <button onClick={buildConsensus} disabled={loadingConsensus} style={{
            width: "100%", padding: "15px",
            background: loadingConsensus ? "#060c14" : "linear-gradient(135deg, #cc00ff18, #00e5ff18)",
            border: "1px solid #cc00ff88",
            borderRadius: 6, color: "#cc00ff",
            fontSize: 12, letterSpacing: 3, cursor: loadingConsensus ? "not-allowed" : "pointer",
            marginTop: 4, fontFamily: "inherit", fontWeight: "bold"
          }}>
            {loadingConsensus ? "◌ CALCUL DU VERDICT..." : "⚡ VERDICT FINAL"}
          </button>
        )}

        {/* Consensus result */}
        {consensus && (
          <div style={{
            marginTop: 12, border: "1px solid #cc00ff44",
            borderRadius: 6, overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(90deg, #cc00ff18, #00e5ff18)",
              padding: "10px 14px", borderBottom: "1px solid #cc00ff22",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#cc00ff", fontWeight: "bold" }}>
                ⚡ VERDICT FINAL
              </div>
              <div style={{ fontSize: 8, color: "#cc00ff66", letterSpacing: 1 }}>
                {productType?.toUpperCase()}
              </div>
            </div>
            <div style={{
              padding: "14px", fontSize: 12, lineHeight: 1.9,
              color: "#fff", background: "#06040f"
            }}>
              {consensus}
            </div>

            {/* Save button */}
            <div style={{ padding: "0 14px 14px" }}>
              <button onClick={saveVerdict} style={{
                width: "100%", padding: "10px",
                background: saved ? "#00ff8818" : "transparent",
                border: `1px solid ${saved ? "#00ff88" : "#1a2a3a"}`,
                borderRadius: 4, color: saved ? "#00ff88" : "#444",
                fontSize: 9, cursor: "pointer", fontFamily: "inherit",
                letterSpacing: 2, transition: "all 0.3s"
              }}>
                {saved ? "✓ SAUVEGARDÉ" : "↓ SAUVEGARDER LE VERDICT"}
              </button>
            </div>
          </div>
        )}

        {/* Reset */}
        {image && (
          <button onClick={() => {
            setImage(null); setImageData(null);
            setReviews({}); setConsensus(null);
            setProductType(null); setSaved(false);
          }} style={{
            width: "100%", padding: "9px",
            background: "transparent", border: "1px solid #0d1520",
            borderRadius: 6, color: "#222", fontSize: 9,
            cursor: "pointer", marginTop: 12, fontFamily: "inherit", letterSpacing: 2
          }}>
            NOUVELLE ANALYSE
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
