# All AI Models in QubitPage® OS

## Medical AI Models

| Model | Params | Purpose | Integration |
|-------|--------|---------|-------------|
| [MedGemma 4B IT](https://huggingface.co/google/medgemma-4b-it) | 4B | Disease diagnosis, drug analysis | Port 5051 |
| [TxGemma 27B Predict](https://huggingface.co/google/txgemma-27b-predict) | 27B | ADMET / therapeutic prediction | Direct API |
| [Med-PaLM 2](https://sites.research.google/med-palm/) | 540B | Medical Q&A reasoning | Google Cloud |
| [BioGPT](https://github.com/microsoft/BioGPT) | 347M | Biomedical text generation | Local/pip |

## General AI Models

| Model | Provider | API Key | Cost | Use in OS |
|-------|----------|---------|------|---------|
| Gemini 2.0 Flash | Google | GEMINI_API_KEY | Free tier | ARIA assistant |
| Gemini 1.5 Pro | Google | GEMINI_API_KEY | Free tier (limited) | Research synthesis |
| Llama 3.3 70B | Meta/Groq | GROQ_API_KEY | Free (14,400 req/day) | Fast reasoning |
| Mixtral 8x7B | Mistral/Groq | GROQ_API_KEY | Free (14,400 req/day) | Fallback |

## Quantum AI Models

| Model | Type | Use |
|-------|------|-----|
| [Qiskit Runtime Primitives](https://docs.quantum.ibm.com) | Hybrid quantum-classical | VQE, QAOA in Drug sim |
| [PennyLane QNN](https://pennylane.ai) | Quantum neural networks | Molecular property learning |
| [Quantum Kernel SVM](https://qiskit.org/ecosystem/machine-learning) | QSVM | Drug-target classification |

## Free API Keys (No Credit Card Required)

1. **Google Gemini** — [aistudio.google.com](https://aistudio.google.com) → Get API key → Free 1M tokens/month
2. **Groq** — [console.groq.com](https://console.groq.com) → Free 14,400 requests/day
3. **IBM Quantum** — [quantum.ibm.com](https://quantum.ibm.com) → Free 10 min/month on real hardware
4. **HuggingFace** — [huggingface.co](https://huggingface.co) → Free Inference API for MedGemma/TxGemma
