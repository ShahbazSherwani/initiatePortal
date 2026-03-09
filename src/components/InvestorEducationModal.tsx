// src/components/InvestorEducationModal.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from "../config/environment";
import { toast } from "react-hot-toast";

interface Props {
  onComplete: () => void;
}

const SECTIONS = [
  {
    title: "What is Equity Crowdfunding?",
    icon: "📚",
    body: `Equity crowdfunding allows businesses (Issuers) to raise capital from the public by offering equity or debt instruments through a licensed Crowdfunding Intermediary (CFI) like Initiate PH, registered with the SEC.

As an investor, you are providing funds to a business in exchange for a share in its growth (equity) or a return on your loan (lending). This is different from donations — you expect a financial return based on the campaign terms.

Initiate PH operates under SEC Memorandum Circular No. 14, Series of 2019 (Crowdfunding Rules).`,
  },
  {
    title: "Key Risks You Must Understand",
    icon: "⚠️",
    body: `Crowdfunding investments carry significant risks including:

• **Loss of capital** — You may lose all or part of your investment if the business fails.
• **Illiquidity** — Crowdfunding investments are not easily sold or transferred. There is no secondary market.
• **Limited information** — Issuers are early-stage or small businesses with limited financial history.
• **Dilution** — Your ownership share may decrease if the issuer raises additional funds in the future.
• **Business failure** — Most small businesses fail within the first five years.

Only invest funds you can afford to lose entirely.`,
  },
  {
    title: "Your Investment Limits (SEC Rules)",
    icon: "📊",
    body: `The SEC sets investment limits to protect investors:

• **Retail Investor** (annual income < ₱2M): Maximum investment per issuer is 5% of annual income.
• **Standard Investor** (annual income ₱2M–₱10M): Maximum investment per issuer is 10% of annual income.
• **Qualified Investor** (annual income ≥ ₱10M): No investment cap, subject to KYC verification.

These limits apply across all campaigns from a single issuer on any CFI platform. The platform automatically enforces your limits. You are required to provide accurate income information.`,
  },
  {
    title: "Your Rights as a Crowdfunding Investor",
    icon: "⚖️",
    body: `Under SEC Crowdfunding Rules, you have the right to:

• **Reconfirm or cancel** your investment if the issuer makes a material change to the campaign within 5 business days of notification.
• **Receive a refund** if the campaign fails to reach its minimum funding target by the end date.
• **Access disclosure documents** — The issuer must provide Form CF, business plan, risk factors, and financial statements.
• **Be protected from fraud** — Issuers who misrepresent information are subject to SEC enforcement.

By investing, you acknowledge you have read and understood these rights and risks.`,
  },
];

const QUIZ: { question: string; options: string[]; correct: number }[] = [
  {
    question: "What happens to your investment if the campaign does NOT reach its minimum funding target?",
    options: [
      "The issuer keeps part of the funds raised",
      "You receive a full refund",
      "Your money is held in escrow indefinitely",
      "Nothing — the campaign proceeds anyway",
    ],
    correct: 1,
  },
  {
    question: "If your annual income is ₱1,500,000, what is your maximum investment per issuer under SEC rules?",
    options: ["₱150,000 (10% of income)", "₱75,000 (5% of income)", "No limit", "₱50,000 (flat limit)"],
    correct: 1,
  },
  {
    question: "Which of the following is TRUE about crowdfunding investments?",
    options: [
      "They are guaranteed by the SEC",
      "They are easily sold on a stock exchange",
      "You may lose all of your invested capital",
      "Returns are fixed and guaranteed by the issuer",
    ],
    correct: 2,
  },
];

export const InvestorEducationModal: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<"content" | "quiz" | "result">("content");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [quizIndex, setQuizIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (optionIndex: number) => {
    const updated = [...answers];
    updated[quizIndex] = optionIndex;
    setAnswers(updated);
  };

  const submitQuiz = async () => {
    const correct = answers.filter((a, i) => a === QUIZ[i].correct).length;
    setScore(correct);
    if (correct === QUIZ.length) {
      setSubmitting(true);
      try {
        await authFetch(`${API_BASE_URL}/user/complete-education`, { method: "POST" });
        setStep("result");
      } catch {
        toast.error("Could not save progress. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep("result");
    }
  };

  const retakeQuiz = () => {
    setAnswers(Array(QUIZ.length).fill(null));
    setQuizIndex(0);
    setStep("quiz");
    setScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#0C4B20] px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">🎓</div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">Investor Education Module</h2>
            <p className="text-green-200 text-xs">Required before your first investment · SEC Regulation</p>
          </div>
        </div>

        {/* Progress bar */}
        {step === "content" && (
          <div className="flex gap-1 px-6 pt-4">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= sectionIndex ? "bg-[#0C4B20]" : "bg-gray-200"}`} />
            ))}
          </div>
        )}
        {step === "quiz" && (
          <div className="flex gap-1 px-6 pt-4">
            {QUIZ.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i < quizIndex ? "bg-[#0C4B20]" : i === quizIndex ? "bg-amber-400" : "bg-gray-200"}`} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "content" && (
            <div>
              <div className="text-3xl mb-2">{SECTIONS[sectionIndex].icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{SECTIONS[sectionIndex].title}</h3>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line space-y-2">
                {SECTIONS[sectionIndex].body.split("\n").map((line, i) => {
                  if (line.startsWith("•")) {
                    const [bullet, ...rest] = line.split("**");
                    return (
                      <p key={i} className="flex gap-1.5">
                        <span className="text-[#0C4B20] font-bold mt-0.5">•</span>
                        <span dangerouslySetInnerHTML={{ __html: rest.join("**").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/^• /, "") || bullet.replace("• ", "") }} />
                      </p>
                    );
                  }
                  return line ? <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} /> : <br key={i} />;
                })}
              </div>
            </div>
          )}

          {step === "quiz" && (
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Question {quizIndex + 1} of {QUIZ.length}</p>
              <p className="text-base font-semibold text-gray-900 mb-4">{QUIZ[quizIndex].question}</p>
              <div className="space-y-2">
                {QUIZ[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      answers[quizIndex] === i
                        ? "border-[#0C4B20] bg-green-50 text-[#0C4B20] font-medium"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`inline-block w-5 h-5 rounded-full border text-xs leading-5 text-center mr-2 font-semibold ${answers[quizIndex] === i ? "border-[#0C4B20] text-[#0C4B20]" : "border-gray-300 text-gray-400"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "result" && (
            <div className="text-center py-4">
              {score === QUIZ.length ? (
                <>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold text-[#0C4B20] mb-2">Congratulations!</h3>
                  <p className="text-gray-600 text-sm mb-1">You scored <strong>{score}/{QUIZ.length}</strong> — perfect score.</p>
                  <p className="text-gray-500 text-sm">You have completed the Investor Education Module. Your completion has been recorded.</p>
                  <div className="mt-4 bg-green-50 rounded-xl px-4 py-3 text-xs text-green-700 font-medium">
                    ✓ Education module complete · {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📖</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Not quite there yet</h3>
                  <p className="text-gray-600 text-sm mb-1">You scored <strong>{score}/{QUIZ.length}</strong>. A perfect score is required.</p>
                  <p className="text-gray-500 text-sm">Please review the learning material and try again.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
          {step === "content" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setSectionIndex(i => Math.max(0, i - 1))} disabled={sectionIndex === 0}>
                ← Back
              </Button>
              {sectionIndex < SECTIONS.length - 1 ? (
                <Button size="sm" className="bg-[#0C4B20] text-white hover:bg-[#0C4B20]/90" onClick={() => setSectionIndex(i => i + 1)}>
                  Next →
                </Button>
              ) : (
                <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => { setStep("quiz"); setQuizIndex(0); }}>
                  Take Quiz →
                </Button>
              )}
            </>
          )}
          {step === "quiz" && (
            <>
              <Button variant="outline" size="sm" onClick={() => quizIndex === 0 ? setStep("content") : setQuizIndex(i => i - 1)}>
                ← Back
              </Button>
              {quizIndex < QUIZ.length - 1 ? (
                <Button size="sm" className="bg-[#0C4B20] text-white" onClick={() => setQuizIndex(i => i + 1)} disabled={answers[quizIndex] === null}>
                  Next →
                </Button>
              ) : (
                <Button size="sm" className="bg-[#0C4B20] text-white" onClick={submitQuiz} disabled={answers[quizIndex] === null || submitting}>
                  {submitting ? "Saving..." : "Submit Quiz"}
                </Button>
              )}
            </>
          )}
          {step === "result" && score === QUIZ.length && (
            <Button className="w-full bg-[#0C4B20] text-white hover:bg-[#0C4B20]/90" onClick={onComplete}>
              Continue to Invest →
            </Button>
          )}
          {step === "result" && score < QUIZ.length && (
            <>
              <Button variant="outline" className="flex-1" onClick={() => { setSectionIndex(0); setStep("content"); }}>
                Review Material
              </Button>
              <Button className="flex-1 bg-[#0C4B20] text-white" onClick={retakeQuiz}>
                Retake Quiz
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
