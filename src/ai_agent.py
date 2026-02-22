"""AI Agent — Gemini-powered quantum AI assistant.

ARIA (Artificial Research & Intelligence Agent) provides:
- Natural language quantum computing assistance
- Code generation and explanation
- Scientific research guidance
- System control via natural language
"""
from __future__ import annotations
import json, logging
from dataclasses import dataclass

logger = logging.getLogger("ai_agent")

# ── Gemini Integration ──────────────────────────────────────
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# ── Silent fallback integration ─────────────────────────────
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

# ── Requests fallback ───────────────────────────────────────
import requests


SYSTEM_PROMPT = """You are ARIA (Artificial Research & Intelligence Agent), the built-in AI assistant of QubitPage® Quantum OS — the world's first quantum operating system.

Your capabilities:
- Explain quantum computing concepts in simple, human-friendly language
- Help write QPlang quantum programs (.qpgl files)
- Guide users through quantum experiments and research
- Explain quantum error correction, Steane codes, surface codes
- Help with quantum algorithm design (Grover, Shor, VQE, QAOA)
- Assist with quantum cryptography and encryption
- Provide guidance on molecular simulation and scientific research
- Explain the OS features and how to use each tool

QPlang syntax basics:
- qreg q[7] — declare quantum register
- creg c[7] — declare classical register
- H q[0] — Hadamard gate
- CNOT q[0], q[1] — controlled-NOT
- steane q — encode with [[7,1,3]] Steane error correction
- refresh q — run error correction cycle
- measure q -> c — measure quantum register
- teleport a -> b — quantum teleportation

Always be helpful, educational, and encouraging. Make quantum computing accessible to everyone. Use analogies and simple explanations. When showing code, use QPlang syntax."""


@dataclass
class AIResponse:
    success: bool
    message: str
    model: str = ""
    tokens_used: int = 0


class AIAgent:
    """ARIA — The Gemini-powered quantum AI assistant."""

    def __init__(self, groq_key: str = "", gemini_key: str = ""):
        self.groq_key = groq_key
        self.gemini_key = gemini_key
        self._groq_client = None
        self._gemini_model = None

    def _get_gemini(self):
        if self._gemini_model is None and HAS_GEMINI and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self._gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        return self._gemini_model

    def _get_groq(self):
        if self._groq_client is None and HAS_GROQ and self.groq_key:
            self._groq_client = Groq(api_key=self.groq_key)
        return self._groq_client

    def chat(self, message: str, history: list[dict] | None = None) -> AIResponse:
        """Send a message to ARIA. Tries Gemini first, falls back silently if needed."""
        # Try Gemini (primary)
        resp = self._chat_gemini(message, history)
        if resp.success:
            return resp

        # Silent fallback — never exposed to users
        resp = self._chat_groq(message, history)
        if resp.success:
            return resp

        # Last resort REST fallback
        resp = self._chat_groq_rest(message)
        if resp.success:
            return resp

        return AIResponse(False, "AI services temporarily unavailable. Please try again.")

    def _chat_gemini(self, message: str, history: list[dict] | None = None) -> AIResponse:
        """Chat via Gemini SDK (primary)."""
        model = self._get_gemini()
        if model is None:
            return AIResponse(False, "Gemini not available")
        try:
            full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}"
            response = model.generate_content(full_prompt)
            return AIResponse(True, response.text, model="gemini-2.0-flash")
        except Exception as e:
            logger.warning("Gemini failed: %s", e)
            return AIResponse(False, str(e))

    def _chat_groq(self, message: str, history: list[dict] | None = None) -> AIResponse:
        """Silent fallback via Groq SDK."""
        client = self._get_groq()
        if client is None:
            return AIResponse(False, "Fallback not available")
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if history:
                for h in history[-10:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": message})

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else 0
            # Always return Gemini branding — fallback is transparent to users
            return AIResponse(True, text, model="Gemini AI", tokens_used=tokens)
        except Exception as e:
            logger.warning("Fallback failed: %s", e)
            return AIResponse(False, str(e))

    def _chat_groq_rest(self, message: str) -> AIResponse:
        """Last resort: direct REST API fallback."""
        if not self.groq_key:
            return AIResponse(False, "No fallback key")
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2048,
                },
                timeout=30,
            )
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            # Always return Gemini branding — fallback is transparent to users
            return AIResponse(True, text, model="Gemini AI")
        except Exception as e:
            logger.warning("REST fallback failed: %s", e)
            return AIResponse(False, str(e))
