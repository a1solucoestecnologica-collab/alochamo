import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const router = Router();
const localUploadRoot = path.join(process.cwd(), "uploads");

function extensionFor(file: Express.Multer.File) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  const fromType = byType[file.mimetype];
  if (fromType) return fromType;

  const fromName = file.originalname.split(".").pop()?.toLowerCase();
  return fromName?.replace(/[^\w]/g, "") || "jpg";
}

async function saveLocalUpload(file: Express.Multer.File) {
  const relativeKey = `menu-items/${nanoid()}.${extensionFor(file)}`;
  const absoluteFile = path.join(localUploadRoot, relativeKey);

  await mkdir(path.dirname(absoluteFile), { recursive: true });
  await writeFile(absoluteFile, file.buffer);

  return {
    key: relativeKey,
    url: `/uploads/${relativeKey.replace(/\\/g, "/")}`,
  };
}

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

// Endpoint de upload
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Gerar nome único para o arquivo
    const ext = extensionFor(req.file);
    const fileName = `menu-items/${nanoid()}.${ext}`;

    let result: { key: string; url: string };

    try {
      // Fazer upload para storage externo quando configurado.
      result = await storagePut(fileName, req.file.buffer, req.file.mimetype);
    } catch (storageError) {
      console.warn("Storage externo indisponivel, usando upload local:", storageError);
      result = await saveLocalUpload(req.file);
    }

    res.json({ url: result.url });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao fazer upload da imagem" });
  }
});

export default router;
