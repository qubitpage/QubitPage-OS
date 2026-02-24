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
| **CXR Foundation** | DenseNet-121 | 2,000 domain-specific synthetic images | Normal, Pneumonia, TB, Fibrosis, Lung Cancer | **100% val** |
| **Path Foundation** | ViT-B/16 | 1,600 domain-specific synthetic images | Benign, Malignant Grade 1-3 | **100% val** |
| **Derm Foundation** | EfficientNet-B0 | 750 domain-specific synthetic images | Melanoma, BCC, SCC, Benign Nevus, Actinic Keratosis | **99.73%** |
| **Brain MRI** | ResNet-50 | 1,200 domain-specific synthetic images | Glioblastoma, Meningioma, Metastatic, Normal | **99.78% val** |

> **Note:** Vision models were trained on procedurally-generated synthetic images with disease-specific visual patterns (reticular, nodular, consolidation, cavitary textures). The class labels and architectures are designed to align with established medical imaging benchmarks listed below. For production use, these models should be fine-tuned on real clinical datasets.

### Language Models (Phase 2)

| Model | Base | Method | Params | Final Loss |
|-------|------|--------|--------|------------|
| **MedGemma LoRA** | google/medgemma-4b-it | LoRA r=8, α=16 | 11.9M / 2.5B (0.48%) | **1.4256** |

Training data: 46 expert-curated medical QA pairs sourced from Open Targets, ClinicalTrials.gov, PubChem, and ChEMBL real-world APIs.

### Drug Screening (Phase 3)

| Model | Task | Compounds | Diseases |
|-------|------|-----------|----------|
| **TxGemma ADMET** | BBB, hERG, AMES, DILI, ClinTox, Lipophilicity, Solubility | 23 drugs × 7 tasks = **161 predictions** | GBM, TB, PDAC, ALS, IPF, TNBC, Alzheimer's |

Pre-trained model used directly: [google/txgemma-2b-predict](https://huggingface.co/google/txgemma-2b-predict). Drug SMILES sourced from PubChem and ChEMBL public databases.

---

## 📊 Dataset Sources & References

### Medical Vision Models — Reference Datasets

Our vision model class labels and clinical taxonomy are aligned with the following established medical imaging datasets. These are the recommended datasets for production fine-tuning:

#### CXR Foundation (Chest X-Ray) — Model 09

| Dataset | Description | Size | Link |
|---------|-------------|------|------|
| **NIH ChestX-ray14** | 112,120 frontal-view chest X-rays, 14 pathology labels | 42 GB | [NIH Box](https://nihcc.app.box.com/v/ChestXray-NIHCC) |
| **CheXpert** | 224,316 chest radiographs, 14 observations, uncertainty labels | 439 GB | [Stanford CheXpert](https://stanfordmlgroup.github.io/competitions/chexpert/) |
| **RSNA Pneumonia Detection** | 30,000 chest radiographs for pneumonia detection | 4 GB | [Kaggle](https://www.kaggle.com/c/rsna-pneumonia-detection-challenge) |
| **TBX11K** | 11,200 chest X-rays for tuberculosis detection | 3.2 GB | [TBX11K](https://mmcheng.net/tb/) |
| **MIMIC-CXR** | 377,110 chest X-rays, 14 labels, free text reports | 4.7 TB | [PhysioNet](https://physionet.org/content/mimic-cxr/2.0.0/) |
| **Google CXR Foundation** | Pre-trained embeddings for chest X-ray analysis | — | [HuggingFace](https://huggingface.co/google/cxr-foundation) |

**Key citations:**
- Wang et al. "ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks." *CVPR 2017*. [arXiv:1705.02315](https://arxiv.org/abs/1705.02315)
- Irvin et al. "CheXpert: A Large Chest Radiograph Dataset with Uncertainty Labels." *AAAI 2019*. [arXiv:1901.07031](https://arxiv.org/abs/1901.07031)
- Johnson et al. "MIMIC-CXR-JPG: A Large Publicly Available Database of Labeled Chest Radiographs." *Scientific Data 2019*. [DOI](https://doi.org/10.1038/s41597-019-0322-0)

#### Derm Foundation (Skin Lesions) — Model 12

| Dataset | Description | Size | Link |
|---------|-------------|------|------|
| **ISIC 2019 Challenge** | 25,331 dermoscopic images, 8 diagnostic categories | 9.1 GB | [ISIC Archive](https://challenge.isic-archive.com/data/) |
| **HAM10000** | 10,015 dermoscopic images, 7 lesion types | 2.8 GB | [Harvard Dataverse](https://doi.org/10.7910/DVN/DBW86T) |
| **Fitzpatrick17k** | 16,577 clinical images across Fitzpatrick skin types I-VI | 4.3 GB | [GitHub](https://github.com/mattgroh/fitzpatrick17k) |
| **ISIC 2020 Challenge** | 33,126 dermoscopic images, binary melanoma classification | 25 GB | [Kaggle](https://www.kaggle.com/c/siim-isic-melanoma-classification) |
| **PH² Dataset** | 200 dermoscopic images with expert annotations | 1.5 GB | [ADDI Project](https://www.fc.up.pt/addi/ph2%20database.html) |
| **Google Derm Foundation** | Pre-trained embeddings for dermatology | — | [HuggingFace](https://huggingface.co/google/derm-foundation) |

**Key citations:**
- Tschandl et al. "The HAM10000 dataset: A large collection of multi-source dermatoscopic images of common pigmented skin lesions." *Scientific Data 2018*. [DOI](https://doi.org/10.1038/sdata.2018.161)
- Codella et al. "Skin Lesion Analysis Toward Melanoma Detection 2018." [arXiv:1902.03368](https://arxiv.org/abs/1902.03368)
- Groh et al. "Evaluating Deep Neural Networks Trained on Clinical Images in Dermatology with the Fitzpatrick 17k Dataset." *CVPR 2021*. [arXiv:2104.09957](https://arxiv.org/abs/2104.09957)
- Combalia et al. "BCN20000: Dermoscopic Lesions in the Wild." *Scientific Data 2024*. [arXiv:1908.02288](https://arxiv.org/abs/1908.02288)

#### Brain MRI (Tumor Classification) — Model 11

| Dataset | Description | Size | Link |
|---------|-------------|------|------|
| **Kaggle Brain Tumor MRI** | 7,023 brain MRI images, 4 classes (glioma, meningioma, pituitary, no tumor) | 153 MB | [Kaggle](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) |
| **BraTS 2021** | Multi-parametric MRI scans for brain tumor segmentation | 23 GB | [Synapse](https://www.synapse.org/#!Synapse:syn25829067) |
| **TCGA-GBM** | The Cancer Genome Atlas Glioblastoma dataset (genomics + imaging) | Variable | [GDC Portal](https://portal.gdc.cancer.gov/projects/TCGA-GBM) |
| **Cheng Brain Tumor Dataset** | 3,064 T1-weighted CE-MRI, 3 tumor types | 1.5 GB | [Figshare](https://figshare.com/articles/dataset/brain_tumor_dataset/1512427) |

**Key citations:**
- Cheng et al. "Enhanced Performance of Brain Tumor Classification via Tumor Region Augmentation and Partition." *PLoS ONE 2015*. [DOI](https://doi.org/10.1371/journal.pone.0140381)
- Menze et al. "The Multimodal Brain Tumor Image Segmentation Benchmark (BRATS)." *IEEE TMI 2015*. [DOI](https://doi.org/10.1109/TMI.2014.2377694)
- Bakas et al. "Advancing The Cancer Genome Atlas glioma MRI collections with expert segmentation labels and radiomic features." *Scientific Data 2017*. [DOI](https://doi.org/10.1038/sdata.2017.117)

#### Pathology Foundation (Histopathology) — Model 10

| Dataset | Description | Size | Link |
|---------|-------------|------|------|
| **PatchCamelyon (PCam)** | 327,680 histopathology patches, binary classification | 7.5 GB | [GitHub](https://github.com/basveeling/pcam) |
| **Camelyon16** | 400 whole-slide images, lymph node metastasis detection | 700 GB | [Grand Challenge](https://camelyon16.grand-challenge.org/) |
| **BRACS** | 4,539 breast cancer ROIs, 7 classes | 20 GB | [BRACS](https://www.bracs.icar.cnr.it/) |
| **TCGA Pan-Cancer** | Multi-cancer histopathology slides with grading | Variable | [GDC Portal](https://portal.gdc.cancer.gov/) |
| **Google Path Foundation** | Pre-trained pathology embeddings | — | [HuggingFace](https://huggingface.co/google/path-foundation) |

**Key citations:**
- Veeling et al. "Rotation Equivariant CNNs for Digital Pathology." *MICCAI 2018*. [arXiv:1806.03962](https://arxiv.org/abs/1806.03962)
- Bejnordi et al. "Diagnostic Assessment of Deep Learning Algorithms for Detection of Lymph Node Metastases in Women With Breast Cancer." *JAMA 2017*. [DOI](https://doi.org/10.1001/jama.2017.14585)
- Brancati et al. "BRACS: A Dataset for BReAst Carcinoma Subtyping in H&E Histology Images." *Database 2022*. [DOI](https://doi.org/10.1093/database/baac093)

### Language & Drug Discovery Models — Data Sources

#### MedGemma LoRA (Drug Resistance) — Model 08

| Data Source | Records | API | Link |
|-------------|---------|-----|------|
| **PubChem** | 23 drug compounds with SMILES, properties | REST API | [PubChem](https://pubchem.ncbi.nlm.nih.gov/) |
| **ChEMBL** | 12 compounds with bioactivity data (IC50, Ki) | REST API | [ChEMBL](https://www.ebi.ac.uk/chembl/) |
| **ClinicalTrials.gov** | 140 active clinical trials | REST API | [ClinicalTrials.gov](https://clinicaltrials.gov/) |
| **UniProt** | 12 protein targets | REST API | [UniProt](https://www.uniprot.org/) |
| **Open Targets** | 60 gene-disease associations | GraphQL API | [Open Targets](https://platform.opentargets.org/) |
| **OpenFDA** | 9 drugs with adverse event data | REST API | [OpenFDA](https://open.fda.gov/) |
| **GWAS Catalog** | 30 SNPs per disease | REST API | [GWAS Catalog](https://www.ebi.ac.uk/gwas/) |
| **RCSB PDB** | 10 protein structures | REST API | [PDB](https://www.rcsb.org/) |
| **CRyPTIC Consortium** | 10,209 TB isolates (cited in reports) | Publication | [DOI](https://doi.org/10.1016/S2666-5247(21)00301-3) |

**Key citations:**
- Kim et al. "PubChem 2023 update." *Nucleic Acids Research 2023*. [DOI](https://doi.org/10.1093/nar/gkac956)
- Zdrazil et al. "The ChEMBL Database in 2023." *Nucleic Acids Research 2024*. [DOI](https://doi.org/10.1093/nar/gkad1004)
- CRyPTIC Consortium. "A data compendium associating the genomes of 12,289 Mycobacterium tuberculosis isolates with quantitative resistance phenotypes." *Lancet Microbe 2022*. [DOI](https://doi.org/10.1016/S2666-5247(21)00301-3)

#### TxGemma ADMET Screening — Model 13

| Data Source | Description | Link |
|-------------|-------------|------|
| **Therapeutics Data Commons (TDC)** | ADMET benchmark suite (BBB, hERG, AMES, DILI, ClinTox, Lipophilicity, Solubility) | [TDC](https://tdcommons.ai/benchmark/admet_group/overview/) |
| **Google TxGemma** | Pre-trained therapeutics model (2B parameters) | [HuggingFace](https://huggingface.co/google/txgemma-2b-predict) |
| **PubChem SMILES** | Drug molecular structures (15 compounds across 7 diseases) | [PubChem](https://pubchem.ncbi.nlm.nih.gov/) |

**Key citations:**
- Huang et al. "Therapeutics Data Commons: Machine Learning Datasets and Tasks for Drug Discovery and Development." *NeurIPS 2021*. [arXiv:2102.09548](https://arxiv.org/abs/2102.09548)
- Huang et al. "Artificial Intelligence Foundation for Therapeutic Science." *Nature Chemical Biology 2022*. [DOI](https://doi.org/10.1038/s41589-022-01131-2)

### Quantum Computing Models — Data Sources (Models 01-06)

| Model | Data Source | Description | Link |
|-------|------------|-------------|------|
| **Quantum Circuit (01)** | Stim library | Quantum circuit simulation | [GitHub](https://github.com/quantumlib/Stim) |
| **QEC (02)** | Steane [[7,1,3]] code | Error correction via depolarizing noise | [Wikipedia](https://en.wikipedia.org/wiki/Steane_code) |
| **Gate Optimizer (03)** | IBM Fez noise model | 156-qubit noise calibration | [IBM Quantum](https://quantum.ibm.com/) |
| **State Predictor (04)** | Stim teleportation | Quantum state tomography | [GitHub](https://github.com/quantumlib/Stim) |
| **Noise Classifier (05)** | IBM Fez T1/T2 data | Decoherence calibration | [IBM Quantum](https://quantum.ibm.com/) |
| **Entanglement (06)** | Bell/GHZ circuits | Entanglement fidelity measurement | [IBM Quantum](https://quantum.ibm.com/) |

**Key citations:**
- Gidney, C. "Stim: a fast stabilizer circuit simulator." *Quantum 2021*. [DOI](https://doi.org/10.22331/q-2021-07-06-497)
- Steane, A. "Error Correcting Codes in Quantum Theory." *Physical Review Letters 1996*. [DOI](https://doi.org/10.1103/PhysRevLett.77.793)

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
  - [google/medgemma-4b-it](https://huggingface.co/google/medgemma-4b-it) — MedGemma 4B base model
  - [google/txgemma-2b-predict](https://huggingface.co/google/txgemma-2b-predict) — TxGemma ADMET screening
  - [google/cxr-foundation](https://huggingface.co/google/cxr-foundation) — CXR Foundation reference
  - [google/derm-foundation](https://huggingface.co/google/derm-foundation) — Derm Foundation reference
  - [google/path-foundation](https://huggingface.co/google/path-foundation) — Path Foundation reference
- **Kaggle:** [kaggle.com/mirceasilviurusu](https://www.kaggle.com/mirceasilviurusu)

---

*Built for the MedGemma Impact Challenge 2025-2026 by QubitPage®*
