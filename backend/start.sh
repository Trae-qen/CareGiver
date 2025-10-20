#!/bin/bash
source ~/anaconda3/etc/profile.d/conda.sh
conda activate caregiver
uvicorn main:app --reload --port 8000
