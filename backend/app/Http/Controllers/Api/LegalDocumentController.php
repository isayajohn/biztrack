<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalDocument;
use Illuminate\Http\JsonResponse;

class LegalDocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $documents = LegalDocument::published()->get()->mapWithKeys(
            fn (LegalDocument $document) => [strtolower($document->type) => $this->format($document)]
        );

        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function show(string $type): JsonResponse
    {
        $document = LegalDocument::published()
            ->where('type', strtoupper($type))
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $this->format($document)]);
    }

    private function format(LegalDocument $document): array
    {
        return [
            'type' => $document->type,
            'title' => $document->title,
            'version' => $document->version,
            'effectiveDate' => $document->effective_date?->toDateString(),
            'summary' => $document->summary,
            'sections' => $document->sections ?? [],
            'publishedAt' => $document->published_at?->toIso8601String(),
        ];
    }
}
