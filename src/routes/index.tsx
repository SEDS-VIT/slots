import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
    component: IndexPage,
});

const features = [
    {
        num: "01",
        title: "Telescopes",
        desc: "Peer through powerful telescopes and experience planets, lunar craters, and constellations up close.",
    },
    {
        num: "02",
        title: "Rooftops",
        desc: "Freshers take over the rooftop for an unobstructed, front-row seat to the night sky.",
    },
    {
        num: "03",
        title: "Games",
        desc: "Space-themed games that turn the wait between observations into half the fun.",
    },
    {
        num: "04",
        title: "Quizzes & Sessions",
        desc: "Quizzes and interactive sessions to test your cosmic knowledge and spark curiosity.",
    },
];

function IndexPage() {
    const { data: session } = authClient.useSession();

    const handleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/home",
            additionalParams: {
                hd: "vitstudent.ac.in",
                prompt: "select_account",
            },
        });
    };

    return (
        <>
            <style>{`
                .lp {
                    min-height: 100vh;
                    background: radial-gradient(ellipse at 50% -20%, #1e1b4b 0%, #020617 55%, #000 100%);
                    color: #e2e8f0;
                    font-family: 'Inter', system-ui, sans-serif;
                    overflow-x: hidden;
                    position: relative;
                }

                /* ---------- STAR LAYERS ---------- */
                .stars {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .stars-1 {
                    background-image:
                        radial-gradient(1.5px 1.5px at 20px 30px, #fff, transparent),
                        radial-gradient(1px 1px at 40px 70px, #fff, transparent),
                        radial-gradient(1.5px 1.5px at 50px 160px, #fff, transparent),
                        radial-gradient(1px 1px at 90px 40px, #fff, transparent),
                        radial-gradient(1.5px 1.5px at 130px 80px, #fff, transparent),
                        radial-gradient(1px 1px at 160px 120px, #c7d2fe, transparent),
                        radial-gradient(1.5px 1.5px at 200px 60px, #fff, transparent),
                        radial-gradient(1px 1px at 220px 180px, #fff, transparent);
                    background-size: 250px 250px;
                    opacity: 0.5;
                    animation: drift 120s linear infinite;
                }
                .stars-2 {
                    background-image:
                        radial-gradient(1px 1px at 30px 50px, #a5b4fc, transparent),
                        radial-gradient(1.5px 1.5px at 100px 90px, #fff, transparent),
                        radial-gradient(1px 1px at 180px 30px, #fff, transparent),
                        radial-gradient(1px 1px at 60px 140px, #a5b4fc, transparent),
                        radial-gradient(1.5px 1.5px at 210px 130px, #fff, transparent);
                    background-size: 300px 300px;
                    opacity: 0.4;
                    animation: twinkle 5s ease-in-out infinite;
                }
                .stars-3 {
                    background-image:
                        radial-gradient(2px 2px at 60px 60px, #fff, transparent),
                        radial-gradient(2px 2px at 160px 200px, #c7d2fe, transparent);
                    background-size: 400px 400px;
                    opacity: 0.35;
                    animation: twinkle 7s ease-in-out infinite reverse;
                }

                @keyframes drift {
                    from { transform: translateY(0); }
                    to { transform: translateY(-250px); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.45; }
                    50% { opacity: 0.15; }
                }

                /* ---------- SHOOTING STAR ---------- */
                .shooting-star {
                    position: fixed;
                    top: 12%;
                    left: 70%;
                    width: 140px;
                    height: 2px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.8), #fff);
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
                    opacity: 0;
                    transform: rotate(210deg);
                    animation: shoot 10s linear infinite;
                    pointer-events: none;
                    z-index: 0;
                }
                @keyframes shoot {
                    0% { opacity: 0; transform: rotate(210deg) translateX(0); }
                    4% { opacity: 1; }
                    12% { opacity: 0; transform: rotate(210deg) translateX(-600px); }
                    100% { opacity: 0; }
                }

                /* ---------- NEBULA GLOW ---------- */
                .nebula {
                    position: fixed;
                    width: 600px;
                    height: 600px;
                    right: -180px;
                    bottom: -200px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.28), rgba(30, 27, 75, 0.15) 45%, transparent 70%);
                    filter: blur(60px);
                    pointer-events: none;
                    z-index: 0;
                }

                .lp-content { position: relative; z-index: 1; }

                /* ---------- TOP BAR ---------- */
                .topbar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 1.5rem 2rem;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #c7d2fe;
                    font-weight: 800;
                    letter-spacing: 4px;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                }

                /* ---------- HERO ---------- */
                .hero {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 5rem 1rem 3rem;
                    position: relative;
                }
                .hero-eyebrow {
                    color: #818cf8;
                    letter-spacing: 6px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    margin-bottom: 1.25rem;
                }
                .hero-title {
                    font-size: clamp(2.4rem, 9vw, 5.5rem);
                    font-weight: 900;
                    line-height: 1.05;
                    letter-spacing: 0.04em;
                    margin: 0;
                    background: linear-gradient(180deg, #ffffff 30%, #a5b4fc 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 24px rgba(139, 92, 246, 0.45));
                }
                .hero-tag {
                    margin: 1.25rem 0 2.5rem;
                    color: #a5b4fc;
                    font-size: clamp(0.85rem, 2.5vw, 1.1rem);
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.75rem;
                }
                .hero-tag span { display: flex; align-items: center; gap: 0.75rem; }
                .hero-tag .dot { color: #6366f1; }

                /* ---------- HERO AUTH PANEL ---------- */
                .hero-auth {
                    background: rgba(15, 23, 42, 0.55);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 20px;
                    padding: 1.75rem 1.5rem;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.05);
                }
                .auth-label {
                    color: #818cf8;
                    font-size: 0.7rem;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    margin-bottom: 1rem;
                }
                .google-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 0.95rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #fff;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .google-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #8b5cf6;
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
                    transform: translateY(-2px);
                }
                .google-icon { width: 22px; height: 22px; }
                .auth-note {
                    margin: 0.9rem 0 0;
                    color: #64748b;
                    font-size: 0.75rem;
                    letter-spacing: 0.5px;
                }

                .active-session-box {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    padding: 1.1rem;
                    border-radius: 12px;
                    margin-bottom: 1.25rem;
                }
                .enter-btn {
                    display: block;
                    width: 100%;
                    padding: 0.95rem;
                    background: #4f46e5;
                    color: white;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    transition: all 0.3s;
                }
                .enter-btn:hover {
                    background: #6366f1;
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
                }

                /* ---------- SCROLL CUE ---------- */
                .scroll-cue {
                    position: absolute;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #818cf8;
                    font-size: 0.7rem;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }
                .scroll-cue:hover { opacity: 1; }
                .scroll-cue svg { animation: bounce 2s ease-in-out infinite; }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(6px); }
                }

                /* ---------- ABOUT ---------- */
                .about {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 6rem 1.5rem;
                }
                .section-eyebrow {
                    color: #818cf8;
                    letter-spacing: 5px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    margin: 0 0 1rem;
                }
                .about h2 {
                    color: #fff;
                    font-size: clamp(1.8rem, 5vw, 2.6rem);
                    font-weight: 800;
                    letter-spacing: 1px;
                    margin: 0 0 2rem;
                }
                .about-lead {
                    color: #cbd5e1;
                    font-size: clamp(1rem, 2.5vw, 1.2rem);
                    line-height: 1.9;
                    max-width: 720px;
                    margin: 0;
                }
                .about-lead .lead-words {
                    color: #c4b5fd;
                    font-style: italic;
                    font-weight: 600;
                }

                /* ---------- FEATURE CARDS ---------- */
                .cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1.25rem;
                    margin-top: 3.5rem;
                }
                .card {
                    background: rgba(15, 23, 42, 0.5);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-top: 2px solid rgba(139, 92, 246, 0.5);
                    border-radius: 14px;
                    padding: 1.75rem 1.5rem;
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-6px);
                    border-color: rgba(139, 92, 246, 0.5);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15);
                }
                .card-num {
                    color: #818cf8;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                }
                .card-title {
                    color: #fff;
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin: 0.6rem 0 0.75rem;
                }
                .card-desc {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.7;
                    margin: 0;
                }

                /* ---------- FOOTER ---------- */
                .footer {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #475569;
                    font-size: 0.75rem;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    border-top: 1px solid rgba(99, 102, 241, 0.15);
                }

                @media (max-width: 640px) {
                    .topbar { padding: 1rem 1.25rem; }
                    .about { padding: 4rem 1.25rem; }
                    .scroll-cue { display: none; }
                }
            `}</style>

            <main className="lp">
                <div className="stars stars-1" />
                <div className="stars stars-2" />
                <div className="stars stars-3" />
                <div className="shooting-star" />
                <div className="nebula" />

                <div className="lp-content">
                    <header className="topbar">
                        <div className="brand">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#a5b4fc" }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            Star Party
                        </div>
                    </header>

                    <section className="hero">
                        <p className="hero-eyebrow">A Night Among The Stars</p>
                        <h1 className="hero-title">WELCOME TO STAR PARTY</h1>
                        <p className="hero-tag">
                            <span>Stargazing</span>
                            <span className="dot">·</span>
                            <span>Telescopes</span>
                            <span className="dot">·</span>
                            <span>Rooftops</span>
                            <span className="dot">·</span>
                            <span>Games</span>
                        </p>

                        <div className="hero-auth">
                            {session ? (
                                <div>
                                    <div className="active-session-box">
                                        <p style={{ margin: "0 0 0.25rem 0", color: "#34d399", fontWeight: "bold", fontSize: "0.9rem" }}>
                                            Identity Verified
                                        </p>
                                        <p style={{ margin: 0, color: "#e2e8f0", fontSize: "0.95rem" }}>
                                            Welcome back, {session.user.name}
                                        </p>
                                    </div>
                                    <Link to="/home" className="enter-btn">
                                        Check Your Slot
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    <p className="auth-label">Secure Access</p>
                                    <button onClick={handleLogin} className="google-btn">
                                        <svg className="google-icon" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Sign in with Google
                                    </button>
                                    <p className="auth-note">Use your VIT email to pick your observation slot</p>
                                </div>
                            )}
                        </div>

                        <a href="#about" className="scroll-cue">
                            Mission Briefing
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </a>
                    </section>

                    <section id="about" className="about">
                        <p className="section-eyebrow">Mission Briefing</p>
                        <h2>What is Star Party?</h2>
                        <p className="about-lead">
                            <span className="lead-words">Stargazing. Telescopes. Rooftops. Games.</span>{" "}
                            Just a few words that capture the magic of Star Party — an evening where
                            freshers head to the rooftop, look through powerful telescopes, and
                            experience the night sky up close, while enjoying fun space-themed games,
                            quizzes, and interactive sessions.
                        </p>

                        <div className="cards">
                            {features.map((f) => (
                                <div className="card" key={f.num}>
                                    <span className="card-num">{f.num} //</span>
                                    <h3 className="card-title">{f.title}</h3>
                                    <p className="card-desc">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="footer">
                        Star Party — See you on the rooftop
                    </footer>
                </div>
            </main>
        </>
    );
}
