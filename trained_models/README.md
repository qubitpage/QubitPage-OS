# QubitPage® OS — Trained Models & Research Data

> All models trained on **NVIDIA RTX 3090 Ti (24 GB VRAM)** via Vast.ai GPU cloud.  
> Training date: **February 20, 2026**  
> Competition: **MedGemma Impact Challenge 2025-2026** ($100K prize)

---

## 📦 Model Archives

| # | Package | Size | Architecture | Source Model |
|---|---------|------|-------------|--------------|
| 07 | [Macro Data, News & Drug Screening](07_macro_news_drug_results.zip) | 45 MB | Mixed | TxGemma + Gemini |
| 08 | [MedGemma 4B LoRA Adapter](08_medgemma_lora_adapter.zip) | 34 MB | LoRA r=16/α=32 | [google/medgemma-4b-it](https://huggingface.co/google/medgemma-4b-it) |
| 09 | [CXR Foundation — Chest X-Ray](09_cxr_foundation_model.zip) | 50 MB | DenseNet-121 | [google/cxr-foundation](https://huggingface.co/google/cxr-foundation) |
| 10 | [Path Foundation — Histopathology](10_path_foundation_model.zip) | 606 MB | ViT-B/16 | [google/path-foundation](https://huggingface.co/google/path-foundation) |
| 11 | [Brain MRI — Tumor Classification](11_brain_mri_model.zip) | 167 MB | ResNet-50 | Custom trained |
| 12 | [Derm Foundation — Skin Lesions](12_derm_foundation_model.zip) | 15 MB | EfficientNet-B0 | [google/derm-foundation](https://huggingface.co/google/derm-foundation) |
| 13 | [Medical Training Data & Scripts](13_medical_training_data_scripts.zip) | 1.4 MB | Python scripts | — |

**Total: ~918 MB** (7 packages)

---

## 🔬 Training Details

### Image Models (Phase 1)

| Model | Architecture | Dataset | Classes | Accuracy |
|-------|-------------|---------|---------|----------|
| **CXR Foundation** | DenseNet-121 | 1,000 chest X-rays | Normal, Pneumonia, TB, Cardiomegaly, Effusion | **100% val** |
| **Path Foundation** | ViT-B/16 | 800 histopathology slides | GBM, Meningioma, Normal, Metastatic | **100% val** |
| **Derm Foundation** | EfficientNet-B0 | 750 dermoscopic images | Melanoma, BCC, SCC, Nevus, Actinic Keratosis | **99.73%** |
| **Brain MRI** | ResNet-50 | 600 brain MRI scans | Glioma, Meningioma, Pituitary, Normal | Trained |

### Language Models (Phase 2)

| Model | Base | Method | Params | Final Loss |
|-------|------|--------|--------|------------|
| **MedGemma LoRA** | google/medgemma-4b-it | LoRA r=16, α=32 | 11.9M / 2.5B (0.48%) | **1.4256** |

### Drug Screening (Phase 3)

| Model | Task | Compounds | Diseases |
|-------|------|-----------|----------|
| **TxGemma ADMET** | BBB, hERG, AMES, DILI, ClinTox, Lipophilicity, Solubility | 23 drugs × 7 tasks = **161 predictions** | GBM, TB, PDAC, ALS, IPF, TNBC, Alzheimer's |

---

## 🏗 GPU Infrastructure

- **GPU:** NVIDIA RTX 3090 Ti (24 GB VRAM)
- **Provider:** Vast.ai (on-demand)
- **Framework:** PyTorch 2.6.0+cu124, Transformers 5.2.0, PEFT
- **Total model weights:** ~592 MB

---

## 📋 How to Use

Each zip contains:
- **Model weights** (`.pt`, `.bin`, or adapter files)
- **`training_info.txt`** — Training configuration, hyperparameters, metrics
- **Config files** (where applicable)

### Load a model:

```python
# Example: Load Derm Foundation
import torch
from torchvision import models

model = models.efficientnet_b0(weights=None)
model.classifier[1] = torch.nn.Linear(1280, 5)  # 5 skin lesion classes
model.load_state_dict(torch.load("derm_foundation_best.pt", map_location="cpu"))
model.eval()

# Classes
CLASSES = ["actinic_keratosis", "basal_cell", "benign_nevus", "melanoma", "squamous_cell"]
```

### Load MedGemma LoRA:

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

base = AutoModelForCausalLM.from_pretrained("google/medgemma-4b-it")
model = PeftModel.from_pretrained(base, "./medgemma_lora_adapter/")
tokenizer = AutoTokenizer.from_pretrained("google/medgemma-4b-it")
```

---

## 🔗 Links

- **Live Demo:** [os.qubitpage.com](https://os.qubitpage.com)
- **Repository:** [github.com/qubitpage/QubitPage-OS](https://github.com/qubitpage/QubitPage-OS)
- **HuggingFace Models:** [huggingface.co/google](https://huggingface.co/google)

---

*Built for the MedGemma Impact Challenge 2025-2026 by QubitPage®*
