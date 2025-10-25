"""Simulated product scanner agent."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from ..data_models import (
    ConfidenceLevel,
    ProductCandidate,
    ProductScanRequest,
    ProductScanResult,
)


@dataclass(frozen=True)
class ProductRecord:
    name: str
    brand: str
    ingredients: tuple[str, ...]


BARCODE_DB: Dict[str, ProductRecord] = {
    "012345678905": ProductRecord(
        name="InfyFit Protein Bar",
        brand="InfyFit Labs",
        ingredients=("almonds", "whey protein", "honey", "sea salt"),
    ),
    "5012345678900": ProductRecord(
        name="Whole Grain Pita",
        brand="Whole Hearth",
        ingredients=("whole wheat", "yeast", "olive oil", "sea salt"),
    ),
}


class ProductScannerAgent:
    """Lookup products by barcode or fallback to OCR text."""

    def __init__(self, barcode_db: Dict[str, ProductRecord] | None = None) -> None:
        self._barcode_db = barcode_db or BARCODE_DB

    def scan(self, request: ProductScanRequest) -> ProductScanResult:
        request.one_of_required()
        if request.barcode and request.barcode in self._barcode_db:
            record = self._barcode_db[request.barcode]
            candidate = ProductCandidate(
                name=record.name,
                brand=record.brand,
                barcode=request.barcode,
                ingredients=list(record.ingredients),
            )
            return ProductScanResult(
                candidate=candidate, confidence=ConfidenceLevel.HIGH, lookup_strategy="barcode"
            )

        if request.label_text:
            candidate = ProductCandidate(
                name=self._infer_name_from_label(request.label_text),
                ingredients=self._extract_ingredients(request.label_text),
            )
            confidence = ConfidenceLevel.MEDIUM if candidate.ingredients else ConfidenceLevel.LOW
            return ProductScanResult(
                candidate=candidate,
                confidence=confidence,
                lookup_strategy="label_ocr",
            )

        candidate = ProductCandidate(name="Unknown Product")
        return ProductScanResult(
            candidate=candidate,
            confidence=ConfidenceLevel.LOW,
            lookup_strategy="fallback",
        )

    @staticmethod
    def _infer_name_from_label(text: str) -> str:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return lines[0] if lines else "Unknown Product"

    @staticmethod
    def _extract_ingredients(text: str) -> list[str]:
        lowered = text.lower()
        if "ingredients" not in lowered:
            return []
        _, _, tail = lowered.partition("ingredients")
        parts = tail.replace(":", " ").replace(".", " ").split(",")
        return [part.strip() for part in parts if part.strip()][:10]
