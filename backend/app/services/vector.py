"""
app/services/vector.py
- Vector DB integration (pgvector) and ANN retrieval examples.
- Called by search and recommender.
"""
from typing import List

class VectorIndex:
    def __init__(self):
        pass

    def upsert(self, ids: List[str], vectors: List[List[float]]):
        # TODO: write to pgvector
        pass

    def query(self, vector: List[float], k: int = 20) -> List[str]:
        # TODO: nearest neighbor search
        return []

index = VectorIndex()
