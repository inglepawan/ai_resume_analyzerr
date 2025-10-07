export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // Only run in browser
    if (typeof window === "undefined") {
        throw new Error("PDF conversion is only available in the browser");
    }

    // Load library and resolve a bundler-served worker URL
    loadPromise = Promise.all([
        // @ts-expect-error - pdfjs-dist ESM has no types here
        import("pdfjs-dist/build/pdf.mjs"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([lib, workerMod]) => {
        const workerUrl = (workerMod as any)?.default ?? (workerMod as any);
        // Prefer explicit workerPort to avoid path/type issues across environments
        try {
            const worker = new Worker(workerUrl, { type: "module" });
            lib.GlobalWorkerOptions.workerPort = worker as unknown as Worker;
        } catch (_) {
            // Fallback to workerSrc if constructing a module worker fails
            lib.GlobalWorkerOptions.workerSrc = workerUrl;
        }
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        // Choose a scale that keeps the longest side under MAX_DIMENSION
        const MAX_DIMENSION = 2048;
        const baseViewport = page.getViewport({ scale: 1 });
        const maxSide = Math.max(baseViewport.width, baseViewport.height);
        const autoScale = Math.min(4, MAX_DIMENSION / maxSide);
        const viewport = page.getViewport({ scale: autoScale > 0 ? autoScale : 1 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        if (!context) {
            return {
                imageUrl: "",
                file: null,
                error: "Canvas 2D context unavailable",
            };
        }

        await page.render({ canvasContext: context, viewport }).promise;
        try {
            // Hint PDF.js to free resources sooner
            // @ts-ignore
            page.cleanup && page.cleanup();
            // @ts-ignore
            pdf.cleanup && pdf.cleanup();
        } catch {}

        return new Promise((resolve) => {
            const done = (blob: Blob | null) => {
                if (blob) {
                    const originalName = file.name.replace(/\.pdf$/i, "");
                    const imageFile = new File([blob], `${originalName}.png`, {
                        type: "image/png",
                    });
                    resolve({ imageUrl: URL.createObjectURL(blob), file: imageFile });
                } else {
                    resolve({
                        imageUrl: "",
                        file: null,
                        error: "Failed to create image blob",
                    });
                }
            };

            try {
                canvas.toBlob((blob) => done(blob), "image/png", 1.0);
            } catch (_) {
                try {
                    const dataUrl = canvas.toDataURL("image/png", 1.0);
                    // Convert dataURL to Blob
                    const byteString = atob(dataUrl.split(",")[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                    done(new Blob([ab], { type: "image/png" }));
                } catch {
                    done(null);
                }
            }
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}